import { warn, info, WARN } from "../observability";
import { readTenantSafeMode, writeTenantSafeMode } from "./safeModeStore";

/**
 * SAFE_MODE latch for tenant overrides.
 * Now persisted in VFS: tenant/<id>/safe_mode.json
 *
 * Contract:
 * - If enabled for a tenant, resolvers must ignore overrides (defaults apply).
 * - enable/clear persist state through WriteGateway.
 * - hydrateSafeMode() can be called at bootstrap to restore state cross-restart.
 */
const latch = new Map<string, { enabled: true; reason: string; at: string }>();

export function isTenantOverridesSafeMode(tenantId: string): boolean {
  return latch.has(tenantId);
}

export function getTenantOverridesSafeModeState(tenantId: string) {
  return latch.get(tenantId);
}

/** Bootstrap restore (best-effort). */
export async function hydrateTenantOverridesSafeMode(input: { tenantId: string }) {
  try {
    const rec = await readTenantSafeMode(input.tenantId);
    if (rec.enabled) {
      latch.set(input.tenantId, { enabled: true, reason: rec.reason || "persisted", at: rec.at || new Date().toISOString() });
      info("OK", "Tenant overrides SAFE_MODE hydrated", { tenantId: input.tenantId }, { persisted: true });
    }
    return { ok: true as const, enabled: rec.enabled };
  } catch (e: any) {
    warn(WARN.FALLBACK_DEFAULT_CONFIG, "SAFE_MODE hydrate failed; defaulting to disabled", { tenantId: input.tenantId }, { err: String(e?.message || e) });
    return { ok: false as const, enabled: false };
  }
}

export async function enableTenantOverridesSafeMode(tenantId: string, reason: string, actorId?: string) {
  latch.set(tenantId, { enabled: true, reason, at: new Date().toISOString() });
  await writeTenantSafeMode({ tenantId, enabled: true, reason, ...(actorId ? { actorId } : {}) }).catch(() => {
    warn(WARN.FALLBACK_DEFAULT_CONFIG, "SAFE_MODE persist failed (enable)", { tenantId }, { reason });
  });
}

export async function clearTenantOverridesSafeMode(tenantId: string, actorId?: string) {
  latch.delete(tenantId);
  await writeTenantSafeMode({ tenantId, enabled: false, ...(actorId ? { actorId } : {}) }).catch(() => {
    warn(WARN.FALLBACK_DEFAULT_CONFIG, "SAFE_MODE persist failed (clear)", { tenantId }, {});
  });
}
