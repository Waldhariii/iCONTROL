import type { PolicyContext } from "../policy/types";

export type AuditEvent = {
  ts: string;
  tenantId?: string;
  userId?: string;
  kind: "WRITE_ATTEMPT" | "WRITE_BLOCKED" | "WRITE_OK";
  op: string;
  key?: string;
  details?: Record<string, unknown>;
};

export function nowIso(): string {
  return new Date().toISOString();
}

export function makeAuditEvent(ctx: PolicyContext, ev: Omit<AuditEvent, "ts" | "tenantId" | "userId">): AuditEvent {
  return {
    ts: nowIso(),
    ...(ctx.tenantId ? { tenantId: ctx.tenantId } : {}),
    ...(ctx.userId ? { userId: ctx.userId } : {}),
    ...ev,
  };
}
