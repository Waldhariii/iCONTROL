import { ERROR_CODES } from "../core/errors/error_codes";
import type { FeatureFlag, FeatureFlagSet } from "./feature_flags.schema";

export type GovernedMeta = {
  owner?: string;        // e.g. "core-team@icontrol"
  expires_at?: string;   // ISO date string
  reason?: string;
};

export type GovernedFlag = FeatureFlag & { meta?: GovernedMeta };

export type AuditEntry = {
  level: "INFO" | "WARN" | "ERR";
  code: string;
  message: string;
  data?: Record<string, unknown>;
};

function isIsoDateString(x: unknown): x is string {
  if (typeof x !== "string") return false;
  const t = Date.parse(x);
  return Number.isFinite(t);
}

export function validateGovernedMeta(meta: unknown): { ok: boolean; audit: AuditEntry[] } {
  const audit: AuditEntry[] = [];
  if (meta == null) return { ok: true, audit };

  if (typeof meta !== "object") {
    audit.push({
      level: "WARN",
      code: ERROR_CODES.WARN_FLAG_META_INVALID,
      message: "Feature flag meta must be an object",
    });
    return { ok: false, audit };
  }

  const m = meta as Record<string, unknown>;
  if (m["owner"] != null && typeof m["owner"] !== "string") {
    audit.push({
      level: "WARN",
      code: ERROR_CODES.WARN_FLAG_META_INVALID,
      message: "Feature flag meta.owner must be a string",
    });
  }
  if (m["expires_at"] != null && !isIsoDateString(m["expires_at"])) {
    audit.push({
      level: "WARN",
      code: ERROR_CODES.WARN_FLAG_META_INVALID,
      message: "Feature flag meta.expires_at must be an ISO date string",
    });
  }
  if (m["reason"] != null && typeof m["reason"] !== "string") {
    audit.push({
      level: "WARN",
      code: ERROR_CODES.WARN_FLAG_META_INVALID,
      message: "Feature flag meta.reason must be a string",
    });
  }

  return { ok: audit.length === 0, audit };
}

export function auditGovernedFeatureFlags(
  set: FeatureFlagSet,
  opts?: { now_ms?: number }
): AuditEntry[] {
  const now = typeof opts?.now_ms === "number" ? opts!.now_ms : Date.now();
  const audit: AuditEntry[] = [];

  const flags = (set?.flags || {}) as Record<string, GovernedFlag>;
  for (const key of Object.keys(flags)) {
    const flag = flags[key] as GovernedFlag | undefined;
    if (!flag) continue;

    const meta = (flag as any).meta as unknown;
    const metaCheck = validateGovernedMeta(meta);
    audit.push(...metaCheck.audit.map((e) => ({ ...e, data: { key, ...e.data } })));

    // Governance rules (audit-only)
    const state = (flag as any).state as string | undefined;
    const m = (meta && typeof meta === "object") ? (meta as Record<string, unknown>) : {};

    // Require owner when flag can change behavior (ON / ROLLOUT)
    const owner = m["owner"];
    if ((state === "ON" || state === "ROLLOUT") && (!owner || String(owner).trim().length === 0)) {
      audit.push({
        level: "WARN",
        code: ERROR_CODES.WARN_FLAG_OWNER_MISSING,
        message: "Feature flag missing meta.owner (governance)",
        data: { key, state },
      });
    }

    // Expiry warnings (audit-only; no forced OFF here)
    const expiresAt = m["expires_at"];
    if (expiresAt && typeof expiresAt === "string") {
      const t = Date.parse(expiresAt);
      if (Number.isFinite(t) && now > t) {
        audit.push({
          level: "WARN",
          code: ERROR_CODES.WARN_FLAG_EXPIRED,
          message: "Feature flag meta.expires_at is in the past (governance)",
          data: { key, state, expires_at: expiresAt },
        });
      }
    }
  }

  return audit;
}
