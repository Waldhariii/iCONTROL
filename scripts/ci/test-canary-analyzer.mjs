import { analyzeCanary } from "../../platform/runtime/release/canary-analyzer.mjs";

const policy = {
  window_minutes: 15,
  max_error_rate: 0.02,
  max_p95_latency_increase: 0.25,
  action_on_warn: "hold",
  action_on_fail: "rollback"
};

const baseline = { error_rate: 0.01, p95_latency_ms: 100 };

const fail = analyzeCanary({ baseline, canary: { error_rate: 0.05, p95_latency_ms: 120 }, policy });
if (fail.decision !== "fail") throw new Error("Expected canary fail on error rate");

const pass = analyzeCanary({ baseline, canary: { error_rate: 0.01, p95_latency_ms: 110 }, policy });
if (pass.decision !== "pass") throw new Error("Expected canary pass");

console.log("Canary analyzer PASS");
