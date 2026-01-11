import type { JsonValue } from "../datasources";

export type RuleId = string;

export type RuleContext = {
  // Keep context minimal and serializable.
  // Evolve later: tenant, flags, environment, etc.
  nowIso?: string;
  data?: Record<string, JsonValue>;
};

export type RuleInput = unknown;

export type Rule = {
  id: RuleId;
  apply: (input: RuleInput, ctx: RuleContext) => import("./result").RuleResult;
};
