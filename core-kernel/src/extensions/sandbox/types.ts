export type CapabilityToken = string;

export type SandboxLimits = {
  timeoutMs: number;
  maxConcurrent: number;
  maxQueueDepth: number;
};

export type SandboxContext = {
  tenantId: string;
  correlationId: string;
  actorId?: string;
  caps: CapabilityToken[];
};

export type SandboxResult<T> = { ok: true; value: T } | { ok: false; error: string; code?: string };
