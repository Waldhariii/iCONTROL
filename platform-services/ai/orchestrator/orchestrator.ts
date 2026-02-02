import type { AiProvider, AiRequest, AiResponse } from "./aiProvider.contract";

/**
 * Orchestrator minimal: route par tenant/policy/pricing (future).
 * Ce fichier est volontairement léger pour rester "free-by-default".
 */
export function createAiOrchestrator(provider: AiProvider) {
  return {
    async invoke(req: AiRequest): Promise<AiResponse> {
      return provider.invoke(req);
    },
  };
}
