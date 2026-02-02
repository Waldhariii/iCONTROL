export type ChaosScenario =
  | { kind: "QUEUE_SATURATION"; tenantId: string; depth: number }
  | { kind: "STORAGE_LATENCY"; tenantId: string; ms: number }
  | { kind: "CIRCUIT_OPEN"; tenantId: string; scope: string };

export type ChaosPlan = {
  correlationId: string;
  scenarios: ChaosScenario[];
};

export function validateChaosPlan(p: ChaosPlan): void {
  if (!p.correlationId) throw Object.assign(new Error("correlationId required"), { code: "ERR_CORRELATION_REQUIRED" });
  if (!p.scenarios?.length) throw Object.assign(new Error("scenarios required"), { code: "ERR_CHAOS_EMPTY" });
}
