export type RuleOk<T = unknown> = { ok: true; value: T };
export type RuleErr = { ok: false; reason: "invalid_input" | "blocked" | "not_applicable" | "internal_error"; detail?: string };
export type RuleResult<T = unknown> = RuleOk<T> | RuleErr;

export function ok<T>(value: T): RuleOk<T> { return { ok: true, value }; }
export function err(reason: RuleErr["reason"], detail?: string): RuleErr { return { ok: false, reason, detail }; }
