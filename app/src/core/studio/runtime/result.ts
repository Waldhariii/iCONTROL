export type RuntimeOk<T> = { ok: true; value: T };
export type RuntimeErr = {
  ok: false;
  reason: "invalid_input" | "blocked" | "forbidden" | "not_found" | "backend_error" | "internal_error";
  detail?: string;
};
export type RuntimeResult<T> = RuntimeOk<T> | RuntimeErr;

export function ok<T>(value: T): RuntimeOk<T> { return { ok: true, value }; }
export function err(reason: RuntimeErr["reason"], detail?: string): RuntimeErr { return { ok: false, reason, detail }; }
