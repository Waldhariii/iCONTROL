/**
 * tenantMatrixLoader — TENANT_FEATURE_MATRIX (runtime/configs/ssot).
 * Phase 2.3: enabled_pages, enabled_capabilities par plan.
 */
// @ts-ignore — alias @config
import matrix from "@config/ssot/TENANT_FEATURE_MATRIX.json";

type Plan = "FREE" | "PRO" | "ENTERPRISE";
type Template = { plan: string; enabled_pages: string[]; enabled_capabilities: string[] };

const TEMPLATES = (matrix as { templates: Record<string, Template> }).templates || {};

export function getEnabledPagesForPlan(plan: string): string[] {
  const t = TEMPLATES[String(plan).toUpperCase() as Plan];
  if (t && Array.isArray(t.enabled_pages)) return t.enabled_pages;
  return (TEMPLATES["FREE"] as Template)?.enabled_pages || ["home_app","pages_inventory_app","client_catalog_app","access_denied_app","notfound_app","login_cp","dashboard_cp","access_denied_cp","blocked_cp","notfound_cp"];
}

export function getEnabledCapabilitiesForPlan(plan: string): string[] {
  const t = TEMPLATES[String(plan).toUpperCase() as Plan];
  if (t && Array.isArray(t.enabled_capabilities)) return t.enabled_capabilities;
  return (TEMPLATES["FREE"] as Template)?.enabled_capabilities || ["CORE_SYSTEM"];
}
