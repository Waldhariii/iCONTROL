export interface ShadowSample {
  provider: "core_free" | "paid";
  latency_ms: number;
  ok: boolean;
  cost_usd_est?: number;
}

export interface ShadowSummary {
  samples: number;
  paid_ok_rate: number;
  free_ok_rate: number;
  paid_latency_p95: number;
  free_latency_p95: number;
  cost_delta_usd_est?: number;
  recommendation: "keep_free" | "promote_paid" | "hold_shadow";
}

function p95(nums: number[]): number {
  if (nums.length === 0) return 0;
  const arr = [...nums].sort((a, b) => a - b);
  const idx = Math.floor(0.95 * (arr.length - 1));
  return arr[idx];
}

export function summarizeShadow(samples: ShadowSample[]): ShadowSummary {
  const paid = samples.filter(s => s.provider === "paid");
  const free = samples.filter(s => s.provider === "core_free");

  const paidOk = paid.filter(s => s.ok).length / Math.max(1, paid.length);
  const freeOk = free.filter(s => s.ok).length / Math.max(1, free.length);

  const paidLat = p95(paid.map(s => s.latency_ms));
  const freeLat = p95(free.map(s => s.latency_ms));

  const paidCost = paid.reduce((a, s) => a + (s.cost_usd_est || 0), 0);
  const freeCost = free.reduce((a, s) => a + (s.cost_usd_est || 0), 0);

  const summary: ShadowSummary = {
    samples: samples.length,
    paid_ok_rate: paidOk,
    free_ok_rate: freeOk,
    paid_latency_p95: paidLat,
    free_latency_p95: freeLat,
    cost_delta_usd_est: paidCost - freeCost,
    recommendation: "hold_shadow"
  };

  // Conservative promotion logic:
  if (paid.length >= 30 && paidOk >= freeOk && paidLat <= freeLat) summary.recommendation = "promote_paid";
  if (paidOk + 0.05 < freeOk) summary.recommendation = "keep_free";

  return summary;
}
