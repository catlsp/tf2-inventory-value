import { gitDiff, gitStatus, runProjectChecks } from './checks';
import { planAgents } from './plan';
import { hasCursorAuth, runCursorRole } from './runtime';
import { MAX_FIX_ITERATIONS, type AgentMode, type AgentRole, type RoleResult } from './types';
import { validateTf2Pipeline } from './validate-tf2';

function log(title: string, body?: string): void {
  process.stdout.write(`\n=== ${title} ===\n`);
  if (body) process.stdout.write(`${body}\n`);
}

async function runRole(role: AgentRole, task: string, extra = ''): Promise<RoleResult> {
  if (role === 'tester') {
    const checks = await runProjectChecks('all');
    log('Tester (локальные команды)', checks.summary);
    let detail = checks.summary;
    let ok = checks.ok;
    if (!ok && hasCursorAuth()) {
      const llm = await runCursorRole('tester', task, `Current failures:\n${checks.summary}`);
      const again = await runProjectChecks('all');
      ok = again.ok;
      detail = `${llm.detail}\n\n${again.summary}`;
      log('Tester (повтор после агента)', again.summary);
    }
    return { role, ok, detail };
  }

  if (role === 'validator') {
    const report = await validateTf2Pipeline();
    log('Data Validator (фикстуры)', report.summary);
    let detail = report.summary;
    let ok = report.ok;
    if (hasCursorAuth()) {
      const llm = await runCursorRole('validator', task, report.summary);
      detail = `${report.summary}\n\n${llm.detail}`;
    }
    return { role, ok, detail };
  }

  if (role === 'reviewer') {
    const status = await gitStatus();
    const diff = await gitDiff();
    const extra = `git status:\n${status}\n\ngit diff:\n${diff.slice(0, 60_000)}`;
    if (!hasCursorAuth()) {
      log('Reviewer', extra);
      return {
        role,
        ok: true,
        skipped: true,
        detail: 'Reviewer-модель пропущен (нет CURSOR_API_KEY). Ниже git status/diff для ручной проверки.\n' + extra,
      };
    }
    const llm = await runCursorRole('reviewer', task, extra);
    return { role, ok: llm.ok, detail: llm.detail };
  }

  if (role === 'coder') {
    if (!hasCursorAuth()) {
      return {
        role,
        ok: false,
        skipped: true,
        detail: 'Coder нужен CURSOR_API_KEY, иначе правки кода не запускаются.',
      };
    }
    const llm = await runCursorRole('coder', task, extra);
    return { role, ok: llm.ok, detail: llm.detail };
  }

  if (!hasCursorAuth()) {
    return { role: 'orchestrator', ok: true, skipped: true, detail: extra || 'План без модели.' };
  }
  const llm = await runCursorRole('orchestrator', task, extra);
  return { role: 'orchestrator', ok: llm.ok, detail: llm.detail };
}

export async function runPipeline(mode: AgentMode, task: string): Promise<number> {
  const plan = planAgents(mode, task);
  if (plan.roles.length === 0) {
    process.stdout.write(helpText());
    return 0;
  }

  log('Orchestrator / план', `${plan.reason}\nРоли: ${plan.roles.join(' → ')}`);

  if (mode === 'analyze') {
    const result = await runRole('orchestrator', task || 'Проанализируй текущую архитектуру расширения.');
    log('Готово', result.detail.slice(-4000));
    return result.ok ? 0 : 1;
  }

  const needsCoder = plan.roles.includes('coder');
  const maxIter = needsCoder ? MAX_FIX_ITERATIONS : 1;
  let leftover = '';

  if (plan.roles.includes('orchestrator') && mode === 'task') {
    const brief = await runRole(
      'orchestrator',
      task,
      `Выбери шаги из: ${plan.roles.join(', ')}. Дальше CLI сам вызовет Coder → Tester → Data Validator → Reviewer, максимум ${MAX_FIX_ITERATIONS} итерации исправлений.`,
    );
    leftover = brief.detail;
  }

  const sequence: AgentRole[] = plan.roles.filter((role) => role !== 'orchestrator');

  for (let iteration = 1; iteration <= maxIter; iteration += 1) {
    log(`Итерация ${iteration}/${maxIter}`);
    const results: RoleResult[] = [];
    const issues: string[] = [];

    for (const role of sequence) {
      if (role === 'coder') {
        const extraForCoder =
          iteration > 1 ? `Fix iteration ${iteration}/${maxIter}. Failures:\n${leftover}` : leftover;
        const coded = await runRole('coder', task, extraForCoder);
        results.push(coded);
        if (coded.skipped) {
          log('STOP', 'Coder не запущен: задайте CURSOR_API_KEY и повторите команду.');
          return 1;
        }
        continue;
      }
      results.push(await runRole(role, task, leftover));
    }

    for (const result of results) {
      if (!result.ok && !result.skipped) issues.push(`${result.role}: ${result.detail.slice(-1500)}`);
    }

    const failed = issues.length > 0;
    leftover = issues.join('\n\n');

    if (!failed) {
      log('DONE', `Итераций: ${iteration}. Роли: ${results.map((result) => result.role).join(', ')}`);
      return 0;
    }

    if (iteration === maxIter) {
      log('STOP', `Остановлено после ${iteration} итерации (лимит ${MAX_FIX_ITERATIONS} для цикла с Coder).\n${leftover}`);
      return 1;
    }

    log('Проблемы → Coder', leftover.slice(-2000));
  }

  return 1;
}

export function helpText(): string {
  return `
TF2 Inventory Value — AI dev agents

Запуск из корня репозитория:
  npm run agent -- "добавь отображение профита в trade offer"
  npm run agent -- analyze
  npm run agent -- test
  npm run agent -- validate
  npm run agent -- review

Пайплайн задачи:
  Orchestrator → Coder → Tester → Data Validator → Reviewer
  при проблемах → Coder → Tester (макс. ${MAX_FIX_ITERATIONS} итерации)

Tester всегда гоняет npm test, compile и build.
Data Validator гоняет реальный parser/SKU/price по src/fixtures — без выдуманных значений.

Coder/Reviewer через модель нужен CURSOR_API_KEY (и опционально CURSOR_MODEL).
`.trim();
}
