import type { SandboxContext, SandboxLimits, SandboxResult } from "./types";

/**
 * Sandbox boundary (scaffold):
 * - no side effects at import time
 * - strict timeouts
 * - future: resource quotas, capability firewall, circuit-breaker hooks
 */
export async function runInSandbox<T>(
  ctx: SandboxContext,
  limits: SandboxLimits,
  fn: (ctx: SandboxContext) => Promise<T>
): Promise<SandboxResult<T>> {
  if (!ctx.tenantId) return { ok: false, error: "tenantId required", code: "ERR_TENANT_REQUIRED" };
  if (!ctx.correlationId) return { ok: false, error: "correlationId required", code: "ERR_CORRELATION_REQUIRED" };

  const timeout = new Promise<never>((_, rej) =>
    setTimeout(() => rej(Object.assign(new Error("timeout"), { code: "ERR_TIMEOUT" })), limits.timeoutMs)
  );

  try {
    const value = await Promise.race([fn(ctx), timeout]);
    return { ok: true, value };
  } catch (e: unknown) {
    const err = e as { message?: string; code?: string };
    const out: SandboxResult<T> = { ok: false, error: String(err?.message ?? e) };
    if (err?.code !== undefined) out.code = err.code;
    return out;
  }
}
