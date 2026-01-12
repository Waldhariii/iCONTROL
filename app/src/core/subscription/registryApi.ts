import { createSubscriptionService } from "./subscriptionServiceFactory";
import { FileSubscriptionStore } from "../../../../modules/core-system/subscription/FileSubscriptionStore";
import { SubscriptionRegistry } from "../../../../modules/core-system/subscription/SubscriptionRegistry";

/**
 * Registry API facade (enterprise boundary).
 * NOTE: UI/pages should call a UI-level admin facade, not import core write-model directly.
 */
export async function adminSetActivePlan(args: {
  tenantId: string;
  planId: "enterprise_free" | "enterprise_standard" | "enterprise_pro";
  startedAtIso: string;
  expiresAtIso?: string;
}): Promise<void> {
  // store used by registry (same backing)
  const store = new FileSubscriptionStore();
  const reg = new SubscriptionRegistry(store);
  await reg.setActivePlan({
    tenantId: args.tenantId,
    planId: args.planId,
    startedAt: args.startedAtIso,
    expiresAt: args.expiresAtIso,
  });

  // touch service resolve path to keep behaviour deterministic
  const svc = createSubscriptionService();
  await svc.resolve(args.tenantId, args.startedAtIso);
}

export async function adminCancel(args: {
  tenantId: string;
  canceledAtIso: string;
}): Promise<void> {
  const store = new FileSubscriptionStore();
  const reg = new SubscriptionRegistry(store);
  await reg.cancel({ tenantId: args.tenantId, canceledAt: args.canceledAtIso });

  const svc = createSubscriptionService();
  await svc.resolve(args.tenantId, args.canceledAtIso);
}
