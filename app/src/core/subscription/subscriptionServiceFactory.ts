import { SubscriptionService } from "../../../../modules/core-system/subscription/SubscriptionService";
import { FileSubscriptionStore } from "../../../../modules/core-system/subscription/FileSubscriptionStore";
import { InMemoryAuditTrail } from "../../../../modules/core-system/subscription/AuditTrail";

/**
 * SSOT Factory — enterprise baseline.
 * Important: Everyone reads/writes through the same backing store instance.
 * - Prevents "registry writes, entitlements reads" mismatches.
 * - Keeps fallback enterprise_free deterministic when store is empty.
 */
let _store: FileSubscriptionStore | null = null;

export function getSubscriptionStore(): FileSubscriptionStore {
  if (!_store) _store = new FileSubscriptionStore();
  return _store;
}

export function createSubscriptionService(): SubscriptionService {
  const store = getSubscriptionStore();
  const audit = new InMemoryAuditTrail();
  return new SubscriptionService({ store, audit });
}
