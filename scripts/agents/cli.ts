import { helpText, runPipeline } from './orchestrator';
import { parseCliArgs } from './plan';

const { mode, task } = parseCliArgs(process.argv.slice(2));

if (mode === 'task' && !task) {
  process.stdout.write(`${helpText()}\n`);
  process.exit(0);
}

const code = await runPipeline(mode, task);
process.exit(code);
