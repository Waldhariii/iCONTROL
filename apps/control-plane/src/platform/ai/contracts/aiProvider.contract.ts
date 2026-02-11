export interface AIRequest {
  tenantId: string;
  correlationId?: string;
  model: string;
  input: string;
  maxTokens?: number;
}

export interface AIResponse {
  output: string;
  tokensUsed?: number;
}

export interface AIProvider {
  name: string;
  complete(req: AIRequest): Promise<AIResponse>;
}
