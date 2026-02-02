import type { AIProvider, AIRequest, AIResponse } from "./types";

export type OrchestratorPolicy = {
  maxCostUnits?: number;
  allowFallback?: boolean;
};

export async function runAI(req: AIRequest, providers: AIProvider[], policy: OrchestratorPolicy): Promise<AIResponse> {
  if (!req.tenantId) throw Object.assign(new Error("tenantId required"), { code: "ERR_TENANT_REQUIRED" });
  if (!req.correlationId) throw Object.assign(new Error("correlationId required"), { code: "ERR_CORRELATION_REQUIRED" });
  if (!providers.length) throw Object.assign(new Error("no providers"), { code: "ERR_AI_NO_PROVIDER" });

  const ranked = [...providers].sort((a, b) => a.estimateCost(req) - b.estimateCost(req));
  for (const p of ranked) {
    const est = p.estimateCost(req);
    if (policy.maxCostUnits != null && est > policy.maxCostUnits) continue;
    try {
      return await p.call(req);
    } catch {
      if (!policy.allowFallback) throw;
      continue;
    }
  }
  throw Object.assign(new Error("no provider accepted request"), { code: "ERR_AI_NO_MATCH" });
}
