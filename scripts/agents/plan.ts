import { AGENT_MODES, type AgentMode, type AgentPlan, type AgentRole } from './types';

const IMPLEMENT_RE =
  /\b(add|fix|implement|change|update|refactor|write|create|make|show|display|patch|добав|сделай|исправ|измени|напиш|реализ|покаж|вывед)\b/i;

const TEST_RE = /\b(test|tests|vitest|compile|build|tsc|тест)\b/i;
const DATA_RE =
  /\b(sku|tf2|steam|price|pricedb|unusual|paint|spell|defindex|parser|inventory|trade|hat|weapon|key|ref|цен|парс|атрибут)\b/i;
const REVIEW_RE = /\b(review|ревью|проверь код|code review)\b/i;
const QUESTION_RE = /^(how|what|why|where|когда|как|что|почему|где)\b|\?\s*$/i;

export function parseCliArgs(argv: string[]): { mode: AgentMode; task: string } {
  const args = argv.filter((arg) => arg !== '--');
  const first = args[0]?.toLowerCase();

  if (!first || first === 'help' || first === '-h' || first === '--help') {
    return { mode: 'task', task: '' };
  }

  if ((AGENT_MODES as readonly string[]).includes(first) && first !== 'task') {
    return { mode: first as AgentMode, task: args.slice(1).join(' ').trim() };
  }

  return { mode: 'task', task: args.join(' ').trim() };
}

export function planAgents(mode: AgentMode, task: string): AgentPlan {
  const text = task.trim();

  if (mode === 'analyze') {
    return {
      mode,
      task: text,
      roles: ['orchestrator'],
      reason: 'Режим analyze: только разбор задачи и текущего кода, без правок.',
    };
  }
  if (mode === 'test') {
    return {
      mode,
      task: text,
      roles: ['tester'],
      reason: 'Режим test: vitest, TypeScript compile и production build.',
    };
  }
  if (mode === 'validate') {
    return {
      mode,
      task: text,
      roles: ['validator'],
      reason: 'Режим validate: цепочка Steam → parser → SKU → attributes → price.',
    };
  }
  if (mode === 'review') {
    return {
      mode,
      task: text,
      roles: ['reviewer'],
      reason: 'Режим review: git diff/status и проверка регрессий.',
    };
  }

  if (!text) {
    return { mode, task: text, roles: [], reason: 'Нет задачи.' };
  }

  if (QUESTION_RE.test(text) && !IMPLEMENT_RE.test(text)) {
    return {
      mode,
      task: text,
      roles: ['orchestrator'],
      reason: 'Похоже на вопрос: достаточно Orchestrator без правок кода.',
    };
  }

  const roles: AgentRole[] = ['orchestrator'];
  const wantsCode = IMPLEMENT_RE.test(text) || text.length > 0;
  const wantsTest = TEST_RE.test(text) || wantsCode;
  const wantsData = DATA_RE.test(text) || wantsCode;
  const wantsReview = REVIEW_RE.test(text) || wantsCode;

  if (wantsCode) roles.push('coder');
  if (wantsTest) roles.push('tester');
  if (wantsData) roles.push('validator');
  if (wantsReview) roles.push('reviewer');

  return {
    mode,
    task: text,
    roles: [...new Set(roles)],
    reason:
      'Задача на изменение продукта: изучить код, править, прогнать проверки, валидировать TF2-данные и сделать review.',
  };
}
