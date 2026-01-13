import { appendAuditEvent } from "../audit/auditLog";
import { isSafeMode } from "../runtime/safeMode";

// NOTE: Adapte le chemin si ton entitlements API est ailleurs.
// Ici on assume un accès stable "core/entitlements" avec un read() ou getEntitlements().
import { getEntitlements } from "../entitlements";

/**
 * Codes normalisés (alignés avec ton besoin ERR_/WARN_):
 * - WARN_ACCESS_DENIED_ENTITLEMENT
 * - WARN_ACCESS_DENIED_SAFE_MODE (optionnel: ici, SAFE_MODE n'interdit pas l'accès, il interdit l'écriture)
 */

export type AccessDecision =
  | { ok: true }
  | { ok: false; reason: "missing_entitlement"; entitlement: string }
  | { ok: false; reason: "invalid_input"; entitlement: string };

export type AccessContext = {
  page?: string;          // ex: "/dashboard"
  action?: string;        // ex: "view", "export", "write"
  scope?: string;         // ex: "ui"
  meta?: Record<string, any>;
};

function hasEntitlement(ent: string): boolean {
  const e = getEntitlements?.();
  // On supporte plusieurs formes de store:
  // - Array<string>
  // - Record<string, boolean>
  // - { flags: Record<string, boolean> }
  if (!e) return false;

  if (Array.isArray(e)) return e.includes(ent);

  if (typeof e === "object") {
    const anyE: any = e;
    if (typeof anyE[ent] === "boolean") return !!anyE[ent];
    if (anyE.flags && typeof anyE.flags[ent] === "boolean") return !!anyE.flags[ent];
  }

  return false;
}

export function requireEntitlement(entitlement: string, ctx: AccessContext = {}): AccessDecision {
  const ent = (entitlement || "").trim();
  if (!ent) {
    appendAuditEvent({
      level: "WARN",
      code: "WARN_ACCESS_DENIED_ENTITLEMENT",
      scope: ctx.scope ?? "access",
      message: "Denied: empty entitlement",
      meta: { ...ctx, entitlement: entitlement ?? "" },
    });
    return { ok: false, reason: "invalid_input", entitlement: entitlement ?? "" };
  }

  if (hasEntitlement(ent)) return { ok: true };

  // SAFE_MODE: on loggue l'état, mais on ne transforme pas SAFE_MODE en interdiction d'accès.
  // SAFE_MODE est une gouvernance "read-only", pas une licence.
  appendAuditEvent({
    level: "WARN",
    code: "WARN_ACCESS_DENIED_ENTITLEMENT",
    scope: ctx.scope ?? "access",
    message: "Denied: missing entitlement",
    meta: {
      ...ctx,
      entitlement: ent,
      safeMode: isSafeMode(),
    },
  });

  return { ok: false, reason: "missing_entitlement", entitlement: ent };
}
