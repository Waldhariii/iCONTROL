import type { PluginDecision } from "./types";

export interface PluginTelemetry {
  // All optional; missing values must not crash.
  latency_ms_p95?: number;
  error_rate_pct?: number;
  cost_monthly_usd_est?: number;
  availability_pct_observed?: number;
}

export interface DecisionInputs {
  plugin_id: string;
  limits: { max_monthly_cost_usd: number; };
  sla: { max_latency_ms: number; availability_pct: number; };
  telemetry: PluginTelemetry;
}

/**
 * Deterministic trust scoring (0..100).
 * - Conservative default if telemetry is missing.
 * - Designed for WARN_ONLY / governance; no business logic.
 */
export function computeTrustScore(input: DecisionInputs): { score: number; reason: string; evidence: Record<string, unknown> } {
  const t = input.telemetry || {};
  const latency = typeof t.latency_ms_p95 === "number" ? t.latency_ms_p95 : null;
  const err = typeof t.error_rate_pct === "number" ? t.error_rate_pct : null;
  const cost = typeof t.cost_monthly_usd_est === "number" ? t.cost_monthly_usd_est : null;
  const avail = typeof t.availability_pct_observed === "number" ? t.availability_pct_observed : null;

  let score = 70; // baseline (neutral-good)
  const evidence: Record<string, unknown> = { latency, err, cost, avail };

  if (latency !== null) {
    if (latency > input.sla.max_latency_ms) score -= 20;
    else score += 5;
  } else {
    score -= 5;
  }

  if (err !== null) {
    if (err >= 5) score -= 25;
    else if (err >= 1) score -= 10;
    else score += 5;
  } else {
    score -= 5;
  }

  if (cost !== null) {
    if (cost > input.limits.max_monthly_cost_usd) score -= 20;
    else score += 5;
  } else {
    score -= 5;
  }

  if (avail !== null) {
    if (avail < input.sla.availability_pct) score -= 15;
    else score += 5;
  } else {
    score -= 5;
  }

  score = Math.max(0, Math.min(100, score));

  let reason = "baseline";
  if (score < 30) reason = "critical";
  else if (score < 50) reason = "degraded";
  else if (score < 70) reason = "watch";
  else reason = "healthy";

  return { score, reason, evidence };
}

export function decideAction(plugin_id: string, score: number, reason: string, evidence: Record<string, unknown>): PluginDecision {
  let action: PluginDecision["action"] = "keep";
  if (score < 30) action = "disable";
  else if (score < 50) action = "fallback";
  else if (score < 70) action = "throttle";

  return {
    ts: Date.now(),
    plugin_id,
    trust_score: score,
    action,
    reason,
    evidence
  };
}
