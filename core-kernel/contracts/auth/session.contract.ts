export type TenantId = string;
export type CorrelationId = string;

export type SessionRole = "owner" | "admin" | "tech" | "viewer" | "unknown";

export interface SessionV1 {
  tenantId: TenantId;
  actorId?: string;
  role: SessionRole;
  issuedAt: string; // ISO
  expiresAt?: string; // ISO
  correlationId?: CorrelationId;
}

export interface SessionReader {
  get(): SessionV1 | null;
}

export interface SessionWriter {
  set(s: SessionV1): void;
  clear(): void;
}
