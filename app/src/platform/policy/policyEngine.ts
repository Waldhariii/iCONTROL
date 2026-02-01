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

// --- P2.6.1 additions: capability-aware guard helpers ---
import type { ActorContext, PolicyDecision } from "../securityContext";

export function deny(reasonCode: string): PolicyDecision {
  return { allow: false, reasonCode };
}

export function allow(reasonCode = "OK"): PolicyDecision {
  return { allow: true, reasonCode };
}

export function requireCapability(actor: ActorContext, cap: keyof ActorContext["capabilities"], reasonCode: string): PolicyDecision {
  return actor.capabilities[cap] ? allow("OK") : deny(reasonCode);
}
