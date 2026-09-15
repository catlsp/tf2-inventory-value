import { describe, expect, it } from 'vitest';
import { parseCliArgs, planAgents } from './plan';
import { MAX_FIX_ITERATIONS } from './types';

describe('agent planner', () => {
  it('maps a product task to the full pipeline', () => {
    const plan = planAgents('task', 'Добавь отображение профита в trade offer');
    expect(plan.roles).toEqual(['orchestrator', 'coder', 'tester', 'validator', 'reviewer']);
    expect(MAX_FIX_ITERATIONS).toBe(3);
  });

  it('keeps questions on Orchestrator only', () => {
    const plan = planAgents('task', 'Как собирается SKU для unusual?');
    expect(plan.roles).toEqual(['orchestrator']);
  });

  it('parses dedicated modes', () => {
    expect(parseCliArgs(['analyze', 'trade panel']).mode).toBe('analyze');
    expect(parseCliArgs(['test']).mode).toBe('test');
    expect(parseCliArgs(['validate']).mode).toBe('validate');
    expect(parseCliArgs(['review']).mode).toBe('review');
    expect(parseCliArgs(['исправь цены на металлолом']).mode).toBe('task');
  });

  it('restricts analyze/test/validate/review to a single role', () => {
    expect(planAgents('analyze', 'inventory overlay').roles).toEqual(['orchestrator']);
    expect(planAgents('test', '').roles).toEqual(['tester']);
    expect(planAgents('validate', '').roles).toEqual(['validator']);
    expect(planAgents('review', '').roles).toEqual(['reviewer']);
  });
});
