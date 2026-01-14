export type GovernedFlagMeta = {
  enabled: boolean;
  owner: string;
  justification: string;
  expires_on: string; // YYYY-MM-DD
  risk: "LOW" | "MEDIUM" | "HIGH";
};

export type GovernedFeatureFlags = {
  schema_version: 1;
  flags: Record<string, GovernedFlagMeta>;
};

export type FeatureFlagGovernanceFinding = {
  code: "WARN_FF_MISSING_META" | "WARN_FF_EXPIRED" | "WARN_FF_INVALID_DATE" | "WARN_FF_EMPTY";
  flag?: string;
  details?: Record<string, any>;
};

function isISODate(d: string): boolean {
  // strict YYYY-MM-DD
  return /^\d{4}-\d{2}-\d{2}$/.test(d);
}

function isExpired(expiresOn: string, now: Date): boolean {
  // Interpret expires_on in UTC midnight to avoid TZ drift
  const [y, m, day] = expiresOn.split("-").map((x) => Number(x));
  if (!y || !m || !day) return false;
  const exp = new Date(Date.UTC(y, m - 1, day, 0, 0, 0));
  return exp.getTime() < now.getTime();
}

/**
 * auditGovernedFeatureFlags
 * - audit-only: does not mutate flags
 * - returns findings to be emitted/logged by caller
 */
export function auditGovernedFeatureFlags(
  input: unknown,
  now: Date = new Date(),
): FeatureFlagGovernanceFinding[] {
  const findings: FeatureFlagGovernanceFinding[] = [];

  if (!input || typeof input !== "object") {
    findings.push({ code: "WARN_FF_EMPTY", details: { reason: "not_object" } });
    return findings;
  }

  const obj: any = input as any;
  const flags = obj.flags;

  if (!flags || typeof flags !== "object") {
    findings.push({ code: "WARN_FF_EMPTY", details: { reason: "missing_flags" } });
    return findings;
  }

  for (const [k, v] of Object.entries(flags)) {
    const meta: any = v as any;
    const missing =
      !meta ||
      typeof meta.enabled !== "boolean" ||
      typeof meta.owner !== "string" ||
      meta.owner.trim().length < 2 ||
      typeof meta.justification !== "string" ||
      meta.justification.trim().length < 5 ||
      typeof meta.expires_on !== "string" ||
      typeof meta.risk !== "string";

    if (missing) {
      findings.push({ code: "WARN_FF_MISSING_META", flag: k });
      continue;
    }

    if (!isISODate(meta.expires_on)) {
      findings.push({
        code: "WARN_FF_INVALID_DATE",
        flag: k,
        details: { expires_on: meta.expires_on },
      });
      continue;
    }

    if (isExpired(meta.expires_on, now)) {
      findings.push({ code: "WARN_FF_EXPIRED", flag: k, details: { expires_on: meta.expires_on } });
    }
  }

  return findings;
}
