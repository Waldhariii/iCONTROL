/**
 * Pages Inventory — Collects all pages from ROUTE_CATALOG and registries
 * NOTE: This module is app-scoped - it only loads the registry for the current app to avoid cross-imports
 */

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import catalog from "@config/ssot/ROUTE_CATALOG.json";

type RouteEntry = {
  route_id: string;
  path: string | null;
  app_surface: string;
  page_module_id: string | null;
  permissions_required: string[];
  feature_flag_id: string | null;
  tenant_visibility: string;
  status: "ACTIVE" | "HIDDEN" | "EXPERIMENTAL" | "DEPRECATED";
};

type PageInventoryEntry = {
  index: number;
  pageName: string;
  routeId: string;
  status: string;
  sourceFile: string;
  duplicateGroup: string | null;
  notes: string;
  appSurface: "CP" | "CLIENT";
  path: string | null;
  pageModuleId: string | null;
  inRegistry: boolean;
  inCatalog: boolean;
};

function normalizeBaseName(name: string): string {
  // Remove existing suffixes/numbers: Dashboard_CP, dashboard, dashboard2 => Dashboard
  return name
    .replace(/[-_]/g, " ")
    .replace(/\d+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function detectDuplicates(entries: PageInventoryEntry[]): Map<string, PageInventoryEntry[]> {
  const groups = new Map<string, PageInventoryEntry[]>();
  for (const entry of entries) {
    const baseName = normalizeBaseName(entry.pageName);
    if (!groups.has(baseName)) {
      groups.set(baseName, []);
    }
    groups.get(baseName)!.push(entry);
  }
  // Filter to only groups with duplicates
  const duplicates = new Map<string, PageInventoryEntry[]>();
  for (const [baseName, group] of groups.entries()) {
    if (group.length > 1) {
      duplicates.set(baseName, group);
    }
  }
  return duplicates;
}

function assignDuplicateNumbers(entries: PageInventoryEntry[]): PageInventoryEntry[] {
  const duplicates = detectDuplicates(entries);
  const result = [...entries];
  
  for (const [baseName, group] of duplicates.entries()) {
    // Sort by sourceFile path for deterministic ordering
    const sorted = [...group].sort((a, b) => {
      const aIdx = entries.indexOf(a);
      const bIdx = entries.indexOf(b);
      if (aIdx !== bIdx) return aIdx - bIdx;
      return a.sourceFile.localeCompare(b.sourceFile);
    });
    
    for (let i = 0; i < sorted.length; i++) {
      const entry = sorted[i];
      const idx = result.indexOf(entry);
      if (idx >= 0) {
        const suffix = sorted.length > 1 ? `${i + 1}` : "";
        result[idx] = {
          ...entry,
          pageName: `${baseName}${suffix} ${entry.appSurface}`,
          duplicateGroup: baseName
        };
      }
    }
  }
  
  return result;
}

function getSourceFile(routeId: string, appSurface: "CP" | "CLIENT"): string {
  // File mapping without cross-imports - inferred from ROUTE_CATALOG page_module_id
  // All routeIds now have _cp or _app suffix
  if (appSurface === "CP") {
    const fileMap: Record<string, string> = {
      home_cp: "app/src/pages/cp/home-cp.ts",
      dashboard_cp: "app/src/pages/cp/dashboard.ts",
      subscription_cp: "app/src/pages/cp/subscription.ts",
      tenants_cp: "app/src/pages/cp/tenants.ts",
      entitlements_cp: "app/src/pages/cp/entitlements.ts",
      pages_cp: "app/src/pages/cp/pages.ts",
      "feature-flags_cp": "app/src/pages/cp/feature-flags.ts",
      publish_cp: "app/src/pages/cp/publish.ts",
      audit_cp: "app/src/pages/cp/audit.ts",
      integrations_cp: "app/src/pages/cp/integrations.ts",
      access_denied_cp: "app/src/pages/cp/access-denied.ts",
      blocked_cp: "app/src/pages/cp/blocked.ts",
      notfound_cp: "app/src/pages/cp/notfound.ts",
      ui_catalog_cp: "app/src/pages/cp/ui-catalog.ts",
      account_cp: "app/src/pages/cp/registry.ts",
      settings_cp: "app/src/pages/cp/registry.ts",
      users_cp: "app/src/pages/cp/users.ts",
      system_cp: "app/src/pages/cp/system.ts",
      developer_cp: "app/src/pages/cp/registry.ts",
      developer_entitlements_cp: "app/src/pages/cp/registry.ts",
      verification_cp: "app/src/pages/cp/registry.ts",
      toolbox_cp: "app/src/pages/cp/registry.ts",
      logs_cp: "app/src/pages/cp/registry.ts",
      dossiers_cp: "app/src/pages/cp/registry.ts",
      runtime_smoke_cp: "app/src/pages/runtime-smoke.ts",
      "shell-debug_cp": "app/src/pages/cp/registry.ts"
    };
    return fileMap[routeId] || "app/src/pages/cp/registry.ts";
  } else {
    const fileMap: Record<string, string> = {
      home_app: "app/src/pages/app/home-app.ts",
      client_disabled_app: "app/src/pages/app/client-disabled.ts",
      access_denied_app: "app/src/pages/app/client-access-denied.ts",
      client_catalog_app: "app/src/pages/app/client-catalog.ts",
      pages_inventory_app: "app/src/pages/app/client-pages-inventory.ts",
      notfound_app: "app/src/pages/app/client-disabled.ts"
    };
    return fileMap[routeId] || "app/src/pages/app/registry.ts";
  }
}

export function getPagesInventory(appSurface: "CP" | "CLIENT"): PageInventoryEntry[] {
  const routes = (catalog as { routes: RouteEntry[] }).routes;
  const surface = appSurface === "CP" ? "CP" : "CLIENT";
  
  const entries: PageInventoryEntry[] = [];
  const seenRouteIds = new Set<string>();
  
  // Collect from ROUTE_CATALOG
  for (const route of routes) {
    if (route.app_surface !== surface) continue;
    if (seenRouteIds.has(route.route_id)) continue;
    seenRouteIds.add(route.route_id);
    
    // Check registry without cross-import - use dynamic import check
    // For now, assume in registry if page_module_id matches pattern
    const inRegistry = route.page_module_id 
      ? (appSurface === "CP" ? route.page_module_id.startsWith("cp.") : route.page_module_id.startsWith("app."))
      : false;
    
    entries.push({
      index: 0, // Will be assigned after sorting
      pageName: route.route_id.replace(/_/g, " ").replace(/-/g, " "),
      routeId: route.route_id,
      status: route.status,
      sourceFile: getSourceFile(route.route_id, appSurface),
      duplicateGroup: null,
      notes: inRegistry ? "" : "⚠️ Not in registry",
      appSurface: surface,
      path: route.path,
      pageModuleId: route.page_module_id,
      inRegistry,
      inCatalog: true
    });
  }
  
  // Note: Registry entries not in catalog are not added here to avoid cross-imports
  // If needed, they should be added to ROUTE_CATALOG.json
  
  // Sort by sourceFile for deterministic ordering
  entries.sort((a, b) => a.sourceFile.localeCompare(b.sourceFile));
  
  // Assign indices
  for (let i = 0; i < entries.length; i++) {
    entries[i].index = i + 1;
  }
  
  // Assign duplicate numbers
  const withDuplicates = assignDuplicateNumbers(entries);
  
  return withDuplicates;
}

// NOTE: getPagesInventoryReport removed to avoid cross-imports
// Each app should call getPagesInventory() separately for its own scope
