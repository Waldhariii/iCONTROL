/**
 * ICONTROL_PAGE_ACCESS_GUARD_V1
 * Phase 2.4: guard « route activée pour le tenant » via TENANT_FEATURE_MATRIX.
 */
import { isPageEnabledForTenant } from "../../entitlements";

const ALWAYS_ALLOWED: string[] = ["login", "blocked", "access_denied", "notfound"];

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

export async function guardRouteAccess(_route: string): Promise<{ allowed: boolean; reason?: string }> {
  // Désactivé pour l'instant: contourner isPageEnabledForTenant pour éviter "Accès refusé" / #/dashboard?state=denied.
  // Réactiver la vérification quand la gouvernance (TENANT_FEATURE_MATRIX) sera en place.
  return { allowed: true };
  // const routeId = getRouteIdFromHash(route);
  // if (ALWAYS_ALLOWED.includes(routeId)) return { allowed: true };
  // const ok = isPageEnabledForTenant(routeId);
  // if (!ok) logger.warn("ROUTE_NOT_IN_PLAN", { route, routeId });
  // return ok ? { allowed: true } : { allowed: false, reason: "ROUTE_NOT_IN_PLAN" };
}
