import { safeRender } from "/src/core/runtime/safe";
import { getRole } from "/src/runtime/rbac";
import { getSafeMode } from "/src/core/runtime/safe";
import { canAccess } from "../account/contract";
import * as EntitlementsFacade from "../../shared/entitlements";

/**
 * ICONTROL_SUBSCRIPTION_HUB_V1
 * Enterprise-grade UX: expose plan resolution reason + entitlements, sans dépendre d’un provider.
 */
export async function renderSubscriptionHub(root: HTMLElement): Promise<void> {
  const role = getRole();
  const safeMode = getSafeMode();

  // Reuse baseline access control (same as account)
  if (!canAccess(role, safeMode)) {
    safeRender(root, "<div data-testid='subhub-denied'>Access denied</div>");
    return;
  }

  // TenantId: pour l’instant, demo "t1". À remplacer par tenant context réel.
  const tenantId = "t1";

  // Read-model only
  const diag = await EntitlementsFacade.getEntitlementsForTenant(tenantId);

  // Minimal enterprise support panel
  const html = `
    <div data-testid="subhub-root">
      <h2>Subscription Hub</h2>
      <div><b>Tenant</b>: ${tenantId}</div>
      <div><b>Effective Plan</b>: ${diag.effectivePlanId}</div>
      <div><b>Reason</b>: ${diag.reason ?? "n/a"}</div>
      <hr />
      <h3>Entitlements</h3>
      <pre style="white-space:pre-wrap">${escapeHtml(JSON.stringify(diag.entitlements ?? {}, null, 2))}</pre>
      <p style="opacity:.8">Enterprise-free baseline: if provider absent/invalid, system falls back to enterprise_free.</p>
    </div>
  `;
  safeRender(root, html);
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
