// Single-source audit emitter helper (enterprise governance)
// - Normalizes payload envelope (ts/module/scope/source)
// - Never throws outward; can set failure flags on runtime
// - Keeps call signature compatible with existing audit emitters

export type AuditLevel = "INFO" | "WARN" | "ERROR" | string;

export type EmitFn = (level: AuditLevel, code: string, message: string, payload?: any) => void;

export function resolveAuditEmitter(rt: any): EmitFn | undefined {
  return (
    rt?.audit?.emit ||
    rt?.audit?.log ||
    rt?.auditLog?.append ||
    rt?.core?.audit?.emit
  );
}

export function emitAudit(
  rt: any,
  level: AuditLevel,
  code: string,
  message: string,
  opts: { scope: string; source: string; data?: Record<string, any> },
  failureFlag?: string
): boolean {
  try {
    const emit = resolveAuditEmitter(rt);
    if (typeof emit !== "function") return false;

    const ts = new Date().toISOString();
    const payload = {
      ts,
      module: "control_plane",
      scope: opts.scope,
      source: opts.source,
      ...(opts.data || {}),
    };

    emit.call(rt, level, code, message, payload);
    return true;
  } catch {
    try {
      if (failureFlag && rt) (rt as any)[failureFlag] = true;
    } catch {}
    return false;
  }
}
