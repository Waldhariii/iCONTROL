/**
 * ICONTROL_PAGE_ACCESS_GUARD_V1
 * Phase 2.4: guard « route activée pour le tenant » via TENANT_FEATURE_MATRIX.
 */
import { isPageEnabledForTenant } from "../../entitlements";

const ALWAYS_ALLOWED: string[] = [
  "login_cp",
  "blocked_cp",
  "access_denied_cp",
  "notfound_cp",
  "login_app",
  "client_disabled_app",
  "access_denied_app",
  "notfound_app",
];

export async function isPageAllowed(pageId: string): Promise<boolean> {
  return ALWAYS_ALLOWED.includes(pageId) || isPageEnabledForTenant(pageId);
}

export async function getAllowedPages(): Promise<string[]> {
  return []; // caller may treat as allow-all when empty
}

export async function filterNavigationItems<T extends { pageId?: string; route?: string }>(
  items: T[]
): Promise<T[]> {
  return items;
}

export async function guardRouteAccess(routeId: string): Promise<{ allowed: boolean; reason?: string }> {
  if (ALWAYS_ALLOWED.includes(routeId)) return { allowed: true };
  const ok = isPageEnabledForTenant(routeId);
  return ok ? { allowed: true } : { allowed: false, reason: "ROUTE_NOT_IN_PLAN" };
}
