import { gitDiff, gitStatus, repoRoot, runProjectChecks } from './checks';
import { roleMessage } from './roles';
import type { AgentRole } from './types';
import { validateTf2Pipeline } from './validate-tf2';

function apiKey(): string | undefined {
  const key = process.env.CURSOR_API_KEY?.trim();
  return key || undefined;
}

export function hasCursorAuth(): boolean {
  return Boolean(apiKey());
}

function projectTools() {
  return {
    project_checks: {
      description: 'Run npm test, npm run compile, and/or npm run build in this repo.',
      inputSchema: {
        type: 'object',
        properties: {
          target: {
            type: 'string',
            enum: ['test', 'compile', 'build', 'all'],
            description: 'Which check to run',
          },
        },
      },
      annotations: { title: 'Project checks', readOnlyHint: true },
      async execute(args: Record<string, unknown>) {
        const target = args.target === 'test' || args.target === 'compile' || args.target === 'build' ? args.target : 'all';
        const report = await runProjectChecks(target);
        return report.summary;
      },
    },
    validate_tf2_pipeline: {
      description:
        'Run the real Steam→parser→SKU→price pipeline on src/fixtures. Does not invent missing TF2 values.',
      inputSchema: { type: 'object', properties: {} },
      annotations: { title: 'Validate TF2 data', readOnlyHint: true },
      async execute() {
        const report = await validateTf2Pipeline();
        return report.summary;
      },
    },
    git_status: {
      description: 'git status --porcelain for this repo.',
      inputSchema: { type: 'object', properties: {} },
      annotations: { title: 'git status', readOnlyHint: true },
      async execute() {
        return gitStatus();
      },
    },
    git_diff: {
      description: 'Combined staged and unstaged git diff.',
      inputSchema: { type: 'object', properties: {} },
      annotations: { title: 'git diff', readOnlyHint: true },
      async execute() {
        const diff = await gitDiff();
        return diff.slice(0, 80_000);
      },
    },
  };
}

const READ_TOOLS = ['read', 'grep', 'glob', 'ls'] as const;

function toolsFor(role: AgentRole): { tools?: string[]; disallowedTools?: string[] } {
  if (role === 'orchestrator' || role === 'reviewer' || role === 'validator') {
    return { tools: [...READ_TOOLS, 'mcp'], disallowedTools: ['shell'] };
  }
  return {};
}

function extractText(event: unknown): string {
  if (!event || typeof event !== 'object') return '';
  const row = event as { type?: string; message?: { content?: Array<{ type?: string; text?: string }> }; text?: string };
  if (row.type === 'assistant' && Array.isArray(row.message?.content)) {
    return row.message.content
      .filter((block) => block.type === 'text' && block.text)
      .map((block) => block.text)
      .join('');
  }
  if (typeof row.text === 'string' && (row.type === 'assistant' || row.type === 'text')) return row.text;
  return '';
}

export async function runCursorRole(role: AgentRole, task: string, extra = ''): Promise<{ ok: boolean; detail: string }> {
  const key = apiKey();
  if (!key) {
    return {
      ok: false,
      detail: 'CURSOR_API_KEY не задан. Тесты и TF2-валидация всё равно идут локально; Coder/Reviewer через модель нужны с ключом: https://cursor.com/dashboard/integrations',
    };
  }

  const { Agent, CursorAgentError } = await import('@cursor/sdk');
  const { tools, disallowedTools } = toolsFor(role);
  const modelId = process.env.CURSOR_MODEL?.trim() || 'composer-2.5';

  try {
    await using agent = await Agent.create({
      apiKey: key,
      name: `tf2iv-${role}`,
      model: { id: modelId },
      local: {
        cwd: repoRoot(),
        customTools: projectTools(),
      },
      tools: tools as never,
      disallowedTools: disallowedTools as never,
    });

    process.stdout.write(`\n── ${role} ──\n`);
    const run = await agent.send(roleMessage(role, task, extra));
    let streamed = '';
    if (run.supports?.('stream') !== false) {
      for await (const event of run.stream()) {
        const chunk = extractText(event);
        if (chunk) {
          streamed += chunk;
          process.stdout.write(chunk);
        }
      }
    }
    const result = await run.wait();
    const text =
      (typeof result.result === 'string' && result.result) ||
      streamed ||
      JSON.stringify(result.result ?? '');
    if (!streamed && text) process.stdout.write(`${text}\n`);
    const ok = result.status === 'finished' || result.status === undefined;
    if (role === 'reviewer') {
      const failed = /\bFAIL\b/.test(text) && !/\bPASS\b/.test(text);
      return { ok: ok && !failed, detail: text.slice(-8000) };
    }
    return { ok, detail: text.slice(-8000) };
  } catch (error) {
    if (error instanceof CursorAgentError) {
      return { ok: false, detail: `Cursor SDK: ${error.message}` };
    }
    return { ok: false, detail: error instanceof Error ? error.message : String(error) };
  }
}
