import { InMemorySubscriptionStore } from "../../../../modules/core-system/subscription/SubscriptionStore";
import { InMemoryAuditTrail } from "../../../../modules/core-system/subscription/AuditTrail";
import { SubscriptionService } from "../../../../modules/core-system/subscription/SubscriptionService";

const store = new InMemorySubscriptionStore();
const audit = new InMemoryAuditTrail();
const svc = new SubscriptionService({ store, audit });

export type EntitlementsReadModel = Awaited<ReturnType<typeof svc.resolve>>;

export async function getEntitlementsForTenant(tenantId: string, nowIso?: string): Promise<EntitlementsReadModel> {
  return svc.resolve(tenantId, nowIso);
}

export function getEntitlementsAuditSnapshot() {
  return audit.snapshot();
}
