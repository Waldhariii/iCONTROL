// @ts-nocheck
import type { ResolveOutput } from "./SubscriptionResolver";

export type AuditEvent =
  | { type: "subscription_resolved"; atIso: string; payload: ResolveOutput }
  | { type: "provider_sync_attempt"; atIso: string; tenantId: string; provider: string; ok: boolean; detail?: string };

export type AuditTrail = {
  record(event: AuditEvent): void;
  snapshot(): AuditEvent[];
};

export class InMemoryAuditTrail implements AuditTrail {
  private events: AuditEvent[] = [];

  record(event: AuditEvent): void {
    this.events.push(event);
  }

  snapshot(): AuditEvent[] {
    return [...this.events];
  }
}
