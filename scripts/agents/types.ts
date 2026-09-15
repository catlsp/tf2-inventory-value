export const MAX_FIX_ITERATIONS = 3;

export const AGENT_ROLES = ['orchestrator', 'coder', 'tester', 'validator', 'reviewer'] as const;
export type AgentRole = (typeof AGENT_ROLES)[number];

export const AGENT_MODES = ['task', 'analyze', 'test', 'validate', 'review'] as const;
export type AgentMode = (typeof AGENT_MODES)[number];

export type AgentPlan = {
  mode: AgentMode;
  task: string;
  roles: AgentRole[];
  reason: string;
};

export type CommandResult = {
  name: string;
  ok: boolean;
  code: number | null;
  stdout: string;
  stderr: string;
};

export type ProjectChecks = {
  ok: boolean;
  results: CommandResult[];
  summary: string;
};

export type ValidationIssue = {
  severity: 'error' | 'warning' | 'info';
  fixture?: string;
  field: string;
  message: string;
  actual?: string;
};

export type ValidationReport = {
  ok: boolean;
  fixtures: number;
  issues: ValidationIssue[];
  summary: string;
};

export type RoleResult = {
  role: AgentRole;
  ok: boolean;
  skipped?: boolean;
  detail: string;
};

export type IterationResult = {
  iteration: number;
  results: RoleResult[];
  failed: boolean;
  issues: string[];
};
