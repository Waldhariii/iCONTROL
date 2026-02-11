/**
 * ADMIN_COMPONENTS_REGISTRY — composants UI autorisés pour la surface Admin (CP)
 *
 * Source: apps/control-plane/src/core/ui/
 * Généré: 2026-01-24 (sans CODEX)
 *
 * Utilisation: gouvernance des imports côté pages CP; ne pas importer de composants
 * hors de cette liste pour les écrans Admin.
 */

export interface AdminComponentEntry {
  id: string;
  path: string;
  export: string;
  contract?: string;
}

export const ADMIN_COMPONENTS_REGISTRY: AdminComponentEntry[] = [
  { id: "dataTable", path: "apps/control-plane/src/core/ui/dataTable", export: "createDataTable", contract: "MAIN_SYSTEM_TABLE_CONTRACT" },
  { id: "badge", path: "apps/control-plane/src/core/ui/badge", export: "createBadge" },
  { id: "toast", path: "apps/control-plane/src/core/ui/toast", export: "toast" },
  { id: "emptyState", path: "apps/control-plane/src/core/ui/emptyState", export: "createEmptyState" },
  { id: "errorState", path: "apps/control-plane/src/core/ui/errorState", export: "createErrorState" },
  { id: "sectionCard", path: "apps/control-plane/src/core/ui/sectionCard", export: "createSectionCard" },
  { id: "pageShell", path: "apps/control-plane/src/core/ui/pageShell", export: "createPageShell" },
  { id: "charts", path: "apps/control-plane/src/core/ui/charts", export: "(voir charts)" },
  { id: "themeManager", path: "apps/control-plane/src/core/ui/themeManager", export: "(voir themeManager)" },
  { id: "catalog", path: "apps/control-plane/src/core/ui/catalog", export: "(catalog/registry)" },
  { id: "clientSidebar", path: "apps/control-plane/src/core/ui/clientSidebar", export: "ClientSidebar" },
  { id: "skeletonLoader", path: "apps/control-plane/src/core/ui/skeletonLoader", export: "createSkeletonLoader" },
  { id: "toolbar", path: "apps/control-plane/src/core/ui/toolbar", export: "(voir toolbar)" },
  { id: "kpi", path: "apps/control-plane/src/core/ui/kpi", export: "(voir kpi)" },
];
