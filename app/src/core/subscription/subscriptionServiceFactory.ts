import { SubscriptionService } from "../../../../modules/core-system/subscription/SubscriptionService";
import { InMemoryAuditTrail } from "../../../../modules/core-system/subscription/AuditTrail";
import { FileSubscriptionStore } from "../../../../modules/core-system/subscription/FileSubscriptionStore";

/**
 * Enterprise seam: créer un service SubscriptionService avec persistence.
 * - Store: FileSubscriptionStore (JSON) => gratuit / local / sans provider
 * - Audit: InMemoryAuditTrail (peut être remplacé plus tard par un audit persistant)
 */
export function createSubscriptionService(): SubscriptionService {
  const store = new FileSubscriptionStore();
  const audit = new InMemoryAuditTrail();
  return new SubscriptionService({ store, audit });
}
