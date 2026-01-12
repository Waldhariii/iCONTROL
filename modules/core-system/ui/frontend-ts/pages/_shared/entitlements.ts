/**
 * UI entitlement facade (read-only).
 * Enterprise-grade rule: UI/pages do not import subscription write-model directly.
 * They call this facade boundary instead.
 */
import { getEntitlementsForTenant } from "/src/core/subscription/entitlementsApi";

export { getEntitlementsForTenant };
