import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CommandResult, ProjectChecks } from './types';

const here = path.dirname(fileURLToPath(import.meta.url));

export function repoRoot(): string {
  let dir = here;
  for (let i = 0; i < 6; i += 1) {
    if (existsSync(path.join(dir, 'package.json')) && existsSync(path.join(dir, 'wxt.config.ts'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  return process.cwd();
}

function runCommand(name: string, command: string, args: string[], timeoutMs: number): Promise<CommandResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: repoRoot(),
      env: process.env,
      shell: process.platform === 'win32',
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill();
    }, timeoutMs);

    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      resolve({
        name,
        ok: false,
        code: null,
        stdout,
        stderr: error.message,
      });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        name,
        ok: code === 0,
        code,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      });
    });
  });
}

function npm(): string {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

export async function runProjectChecks(target: 'test' | 'compile' | 'build' | 'all' = 'all'): Promise<ProjectChecks> {
  const jobs: Array<Promise<CommandResult>> = [];
  if (target === 'test' || target === 'all') {
    jobs.push(runCommand('test', npm(), ['test'], 120_000));
  }
  if (target === 'compile' || target === 'all') {
    jobs.push(runCommand('compile', npm(), ['run', 'compile'], 60_000));
  }
  if (target === 'build' || target === 'all') {
    jobs.push(runCommand('build', npm(), ['run', 'build'], 180_000));
  }

  const results = [];
  for (const job of jobs) results.push(await job);

  const failed = results.filter((result) => !result.ok);
  const summary = failed.length === 0
    ? results.map((result) => `${result.name}: ok`).join('; ')
    : failed
      .map((result) => {
        const tail = [result.stderr, result.stdout].filter(Boolean).join('\n').slice(-4000);
        return `${result.name} failed (exit ${result.code ?? 'null'})\n${tail}`;
      })
      .join('\n\n');

  return { ok: failed.length === 0, results, summary };
}

export async function gitStatus(): Promise<string> {
  const result = await runCommand('git-status', 'git', ['status', '--porcelain'], 15_000);
  if (!result.ok) return result.stderr || 'git status failed';
  return result.stdout || '(clean)';
}

export async function gitDiff(): Promise<string> {
  const staged = await runCommand('git-diff-staged', 'git', ['diff', '--cached'], 15_000);
  const unstaged = await runCommand('git-diff', 'git', ['diff'], 15_000);
  const text = [staged.stdout, unstaged.stdout].filter(Boolean).join('\n\n');
  return text || '(no diff)';
}
