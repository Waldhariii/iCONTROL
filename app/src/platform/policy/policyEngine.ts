import type { Decision, PolicyContext, WriteIntent } from "./types";

// Strict-by-default: deny if SAFE_MODE unless explicitly allowed by entitlement.
export function canWrite(ctx: PolicyContext, intent: WriteIntent): Decision {
  if (ctx.safeMode) {
    // allow only logging by default in SAFE_MODE
    if (intent.op === "log:append") return { ok: true };
    return { ok: false, code: "SAFE_MODE_BLOCK", reason: "Write blocked in SAFE_MODE" };
  }
  // RBAC/entitlements hooks (minimal baseline)
  // NOTE: In baseline, we keep permissive; modules can harden via entitlements.
  return { ok: true };
}

export function canRender(_ctx: PolicyContext, _routeId: string): Decision {
  return { ok: true };
}
