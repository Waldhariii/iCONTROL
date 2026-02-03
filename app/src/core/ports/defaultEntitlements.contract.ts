/**
 * Default Entitlements (free-core baseline)
 * - Must be deterministic and safe in prod
 * - Allows governed overrides by tenant, but baseline stays stable
 */
import type { TenantKey } from "./tenantOnboarding.contract";

export type EntitlementKey = string;

export type EntitlementsSnapshot = {
  tenantKey: TenantKey;
  granted: EntitlementKey[];
  source: "default-baseline" | "governed-override";
};

export interface DefaultEntitlementsPort {
  getDefaultEntitlements(tenantKey: TenantKey): Promise<EntitlementsSnapshot>;
}
