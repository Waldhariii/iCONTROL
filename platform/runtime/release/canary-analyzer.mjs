export function analyzeCanary({ baseline, canary, policy }) {
  const reasons = [];
  const baseErr = baseline.error_rate || 0;
  const canErr = canary.error_rate || 0;
  const baseP95 = baseline.p95_latency_ms || 0;
  const canP95 = canary.p95_latency_ms || 0;

  if (canErr > policy.max_error_rate) reasons.push("error_rate");
  if (baseP95 > 0 && canP95 > baseP95 * (1 + policy.max_p95_latency_increase)) reasons.push("p95_latency");

  if (reasons.length) return { decision: "fail", reasons };
  const warn = [];
  if (canErr > policy.max_error_rate * 0.8) warn.push("error_rate_near_limit");
  if (baseP95 > 0 && canP95 > baseP95 * (1 + policy.max_p95_latency_increase * 0.8)) warn.push("p95_latency_near_limit");
  if (warn.length) return { decision: "warn", reasons: warn };
  return { decision: "pass", reasons: [] };
}
