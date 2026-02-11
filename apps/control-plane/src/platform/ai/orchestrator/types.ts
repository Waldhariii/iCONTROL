export type AIProviderId = string;

export type AIRequest = {
  tenantId: string;
  correlationId: string;
  model: string;
  prompt: string;
  maxTokens?: number;
};

export type AIResponse = {
  provider: AIProviderId;
  model: string;
  output: string;
  costUnits?: number;
};

export type AIProvider = {
  id: AIProviderId;
  estimateCost: (req: AIRequest) => number;
  call: (req: AIRequest) => Promise<AIResponse>;
};
