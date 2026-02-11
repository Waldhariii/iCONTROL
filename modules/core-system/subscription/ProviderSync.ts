// @ts-nocheck
import type { SubscriptionStore } from "./SubscriptionStore";
import type { AuditTrail } from "./AuditTrail";
import type { ProviderPort, ProviderSubscriptionPayload } from "./ProviderPort";

export type ProviderSyncDeps = {
  store: SubscriptionStore;
  audit: AuditTrail;
  port: ProviderPort;
};

/**
 * ProviderSync:
 * - Optional: can be called when provider is available.
 * - Must never break system if provider is down.
 * - Free-by-default is preserved since resolver falls back.
 */
export async function syncFromProvider(deps: ProviderSyncDeps, payload: ProviderSubscriptionPayload): Promise<void> {
  const atIso = new Date().toISOString();
  try {
    const record = deps.port.toSubscriptionRecord(payload);
    await deps.store.upsert(record);
    deps.audit.record({ type: "provider_sync_attempt", atIso, tenantId: payload.tenantId, provider: payload.provider, ok: true });
  } catch (e: any) {
    deps.audit.record({
      type: "provider_sync_attempt",
      atIso,
      tenantId: payload.tenantId,
      provider: payload.provider,
      ok: false,
      detail: String(e?.message ?? e),
    });
    // Intentionally swallow errors to preserve enterprise-free continuity.
  }
}
