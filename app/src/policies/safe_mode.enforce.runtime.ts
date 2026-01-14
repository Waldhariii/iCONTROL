import { ERROR_CODES } from "../core/errors/error_codes";
import { AUDIT_SCOPES } from "./audit.scopes";
import { emitAudit } from "./audit.emit";

export type SafeModeEnforcementLevel = "OFF" | "SOFT" | "HARD";
export type SafeModeWriteAction = "create" | "update" | "delete";

export type SafeModeDecision = {
  allowed: boolean;
  enforced: boolean;
  level: SafeModeEnforcementLevel;
  reason?: string;
};

type AnyRt = any;

const SCOPE =
  (AUDIT_SCOPES as any)?.SAFE_MODE_ENFORCEMENT ?? "safe_mode_enforcement";

function nowIso(): string {
  try {
    return new Date().toISOString();
  } catch {
    return "";
  }
}

function getCapabilities(rt: AnyRt): string[] {
  const caps =
    rt?.__versionPolicy?.capabilities ||
    rt?.__capabilities ||
    rt?.capabilities ||
    rt?.policy?.capabilities ||
    [];
  return Array.isArray(caps) ? caps.map(String) : [];
}

function hasBypass(rt: AnyRt, allow: string[] | undefined): boolean {
  const allowList = Array.isArray(allow) ? allow.map(String) : [];
  if (!allowList.length) return false;
  const caps = getCapabilities(rt);
  return allowList.some((c) => caps.includes(c));
}

function readEnforcementPolicy(rt: AnyRt): any {
  // Convention runtime: __SAFE_MODE__ publié par P0.4
  // On ajoute un sous-bloc optionnel __SAFE_MODE__.enforcement (policy-driven)
  const sm = rt?.__SAFE_MODE__ || rt?.SAFE_MODE || {};
  const enforcement = (sm as any)?.enforcement || {};
  return enforcement && typeof enforcement === "object" ? enforcement : {};
}

function isWithinWindow(effectiveFrom?: string, expiresAt?: string): boolean {
  // Si pas de fenêtres -> considéré actif (policy owner gère)
  const t = Date.now();
  if (effectiveFrom) {
    const ef = Date.parse(effectiveFrom);
    if (!Number.isNaN(ef) && t < ef) return false;
  }
  if (expiresAt) {
    const ex = Date.parse(expiresAt);
    if (!Number.isNaN(ex) && t >= ex) return false;
  }
  return true;
}

function normalizeLevel(x: any): SafeModeEnforcementLevel {
  const v = String(x || "OFF").toUpperCase();
  if (v === "SOFT" || v === "HARD" || v === "OFF") return v;
  return "OFF";
}

function normalizeActions(x: any): SafeModeWriteAction[] {
  if (!Array.isArray(x)) return [];
  return x
    .map((a) => String(a).toLowerCase())
    .filter(
      (a): a is SafeModeWriteAction =>
        a === "create" || a === "update" || a === "delete",
    );
}

function normalizeScope(x: any): string[] {
  if (!Array.isArray(x)) return [];
  return x.map((s) => String(s).toLowerCase());
}

function safeEmitOnce(
  rt: AnyRt,
  key: string,
  payload: { level: "WARN" | "ERR"; code: string; message: string; data?: any },
) {
  try {
    if (!rt) return;
    if (rt[key]) return;
    rt[key] = true;

    const emit =
      rt?.audit?.emit ||
      rt?.audit?.log ||
      rt?.auditLog?.append ||
      rt?.core?.audit?.emit;
    if (typeof emit !== "function") return;

    emitAudit(
      rt,
      payload.level,
      payload.code,
      payload.message,
      {
        scope: SCOPE,
        source: "safe_mode_enforce",
        data: payload.data || {},
      },
      "__SAFE_MODE_ENFORCE_AUDIT_FAILED__",
    );
  } catch {
    try {
      rt.__SAFE_MODE_ENFORCE_AUDIT_FAILED__ = true;
    } catch {}
  }
}

export function enforceSafeModeWrite(
  rt: AnyRt,
  action: SafeModeWriteAction,
  ctx?: Record<string, any>,
): SafeModeDecision {
  // Default: allowed, not enforced
  const decision: SafeModeDecision = {
    allowed: true,
    enforced: false,
    level: "OFF",
  };

  try {
    const sm = rt?.__SAFE_MODE__ || {};
    const enabled = Boolean((sm as any)?.enabled);
    if (!enabled) return decision;

    const pol = readEnforcementPolicy(rt);

    const level = normalizeLevel(pol.level);
    decision.level = level;

    // OFF => no enforcement
    if (level === "OFF") return decision;

    // Scope gating
    const scope = normalizeScope(pol.scope);
    if (!scope.includes("write")) return decision;

    // Active window gating
    const effectiveFrom = pol.effective_from
      ? String(pol.effective_from)
      : undefined;
    const expiresAt = pol.expires_at ? String(pol.expires_at) : undefined;
    if (!isWithinWindow(effectiveFrom, expiresAt)) return decision;

    // Bypass via capabilities
    const bypass = hasBypass(rt, pol.allow_bypass_capabilities);
    if (bypass) return decision;

    const blocked = normalizeActions(pol.blocked_actions);
    if (!blocked.includes(action)) return decision;

    const msg = String(pol.message || "SAFE_MODE write policy");
    const reason = String((sm as any)?.reason || pol.reason || "safe_mode");
    const ts = nowIso();

    if (level === "SOFT") {
      // audit-only warn, allowed
      decision.allowed = true;
      decision.enforced = true;
      decision.reason = reason;

      safeEmitOnce(rt, "__SAFE_MODE_WRITE_SOFT_AUDITED__", {
        level: "WARN",
        code:
          (ERROR_CODES as any)?.WARN_SAFE_MODE_WRITE_SOFT ??
          "WARN_SAFE_MODE_WRITE_SOFT",
        message: msg,
        data: { action, reason, ts, ctx: ctx || {} },
      });

      return decision;
    }

    // HARD => block decision (still audit-first, no throw)
    decision.allowed = false;
    decision.enforced = true;
    decision.reason = reason;

    safeEmitOnce(rt, "__SAFE_MODE_WRITE_BLOCKED_AUDITED__", {
      level: "ERR",
      code:
        (ERROR_CODES as any)?.ERR_SAFE_MODE_WRITE_BLOCKED ??
        "ERR_SAFE_MODE_WRITE_BLOCKED",
      message: msg,
      data: { action, reason, ts, ctx: ctx || {} },
    });

    return decision;
  } catch {
    // Never throw outward
    try {
      rt.__SAFE_MODE_ENFORCE_FAILED__ = true;
    } catch {}
    return decision;
  }
}
