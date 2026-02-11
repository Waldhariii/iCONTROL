/**
 * AI Provider Contract
 * Objectif: swap providers (openai/local/edge) sans lock-in ni side-effects.
 */

export type AiModel = string;

export type AiRequest = {
  tenantId: string;
  model: AiModel;
  input: string;
  maxTokens?: number;
  temperature?: number;
  metadata?: Record<string, unknown>;
};

export type AiResponse = {
  output: string;
  usage?: { inputTokens?: number; outputTokens?: number };
  latencyMs?: number;
};

export interface AiProvider {
  invoke(req: AiRequest): Promise<AiResponse>;
}
