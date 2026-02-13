// @ts-nocheck
import {
  getRole,
  hasPermission,
  canAccessSettings,
  canAccessThemeStudio,
  canAccessTenants,
  canAccessProviders,
  canAccessPolicies,
  canAccessSecurity
} from "/src/runtime/rbac";
import { createPageShell } from "/src/core/ui/pageShell";
import { safeRender } from "../_shared/mainSystem.shared";
import { mountSections, type SectionSpec } from "../_shared/sections";
import { recordObs } from "../_shared/audit";
import { OBS } from "../_shared/obsCodes";
import { getSafeMode } from "../_shared/safeMode";
import { renderAccessDenied } from "../_shared/renderAccessDenied";
import { sectionCard, appendParagraph, appendActionRow, bindActions, type UiAction, el } from "../_shared/uiBlocks";
import { canAccess } from "./contract";
import { createSystemModel } from "./model";
import { renderSystemFlags } from "./sections/flags";
import { renderSystemLayout } from "./sections/layout";
import { renderSystemSafeMode } from "./sections/safe-mode";
import { renderSystemFlagsActions } from "./sections/flags-actions";
import { renderSystemSafeModeActions } from "./sections/safe-mode-actions";
import { renderSystemCacheAudit } from "./sections/cache-audit";
import { renderSystemHealthCharts } from "./sections/health-charts";
import { renderChartGallery } from "./sections/chart-gallery";
// @ts-ignore
import catalog from "@config/ssot/ROUTE_CATALOG.json";
import { renderPlansSection } from "./sections/plans";
import { renderSubscriptionsSection } from "./sections/subscriptions";
import { renderSystemOverview } from "./sections/overview";

function mapSafeMode(s: string): "OFF" | "COMPAT" | "STRICT" {
  return s === "STRICT" ? "STRICT" : s === "COMPAT" ? "COMPAT" : "OFF";
}

type SystemHubItem = {
  id: string;
  label: string;
  hash: string;
  order: number;
  permissions: string[];
};

type PlanMatrix = {
  version?: string;
  templates?: Record<string, any>;
};

function titleizeRouteId(routeId: string): string {
  return routeId
    .replace(/^cp\./, "")
    .replace(/_cp$/, "")
    .replace(/_app$/, "")
    .replace(/[-_]+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join(" ");
}

function isAllowedByPermissions(perms: string[]): boolean {
  if (!perms.length) return true;
  const map: Record<string, () => boolean> = {
    canAccessSettings,
      canAccessThemeStudio,
    canAccessTenants,
    canAccessProviders,
    canAccessPolicies,
    canAccessSecurity,
  };
  return perms.every((p) => {
    const fn = map[p];
    if (fn) return fn();
    return hasPermission(p);
  });
}

function getSystemHubItems(): SystemHubItem[] {
  const routes = (catalog as any)?.routes ?? [];
  return routes
    .filter((r: any) => r && r.app_surface === "CP")
    .filter((r: any) => typeof r.path === "string" && r.path.startsWith("#/"))
    .map((r: any) => {
      const nav = (r && typeof r.nav_visibility === "object") ? r.nav_visibility : null;
      if (!nav || nav.system_tabs !== true) return null;
      const order = typeof nav.system_order === "number" ? nav.system_order : 999;
      const routeId = String(r.route_id || "");
      const label = titleizeRouteId(routeId || r.path || "");
      const perms = Array.isArray(r.permissions_required) ? r.permissions_required.map(String) : [];
      return {
        id: routeId.replace(/_cp$/, ""),
        label,
        hash: String(r.path || ""),
        order,
        permissions: perms,
      } as SystemHubItem;
    })
    .filter(Boolean)
    .filter((item: SystemHubItem) => isAllowedByPermissions(item.permissions))
    .sort((a: SystemHubItem, b: SystemHubItem) => (a.order - b.order) || a.label.localeCompare(b.label));
}

function renderSystemHub(host: HTMLElement): void {
  const items = getSystemHubItems();
  const card = sectionCard("System Hub");
  appendParagraph(
    card,
    "Hub CP: accès rapide aux pages système existantes (Users, Entitlements/Abonnements, Logs, Security, Verification, Settings)."
  );

  if (!items.length) {
    appendParagraph(card, "Aucune entrée disponible (vérifier ROUTE_CATALOG.nav_visibility.system_tabs).");
    host.appendChild(card);
    return;
  }

  const actions: UiAction[] = items.map((it) => ({
    id: `system:${it.id}`,
    label: it.label,
    type: "navigate",
    payload: it.hash
  }));
  const row = appendActionRow(card, actions);
  bindActions(row, actions, { allowRoutes: items.map((it) => it.hash) });
  host.appendChild(card);
}

function getAllRouteIds(): string[] {
  const routes = (catalog as any)?.routes ?? [];
  const ids = routes
    .map((r: any) => String(r?.route_id || ""))
    .filter(Boolean);
  return Array.from(new Set(ids)).sort((a, b) => a.localeCompare(b));
}

function renderSystemOverview(host: HTMLElement): void {
  renderSystemOverview(host);
}

function renderSystemSubscriptions(host: HTMLElement): void {
  renderSubscriptionsSection(host);
}

function renderSystemPlans(host: HTMLElement): void {
  renderPlansSection(host);

}

type SystemTab = {
  id: string;
  label: string;
  sectionIds: string[];
};

const SYSTEM_TAB_KEY = "cp.system.tab";

function getSystemTabs(): SystemTab[] {
  return [
    { id: "hub", label: "Overview", sectionIds: ["system-overview"] },
    { id: "plans", label: "Plans", sectionIds: ["system-plans"] },
    { id: "subscriptions", label: "Abonnements", sectionIds: ["system-subscriptions"] },
    {
      id: "ops",
      label: "Ops",
      sectionIds: [
        "system-health-charts",
        "system-chart-gallery",
        "system-safe-mode",
        "system-cache-audit",
        "system-safe-mode-actions",
        "system-flags",
        "system-flags-actions",
        "system-layout",
      ],
    },
  ];
}

function readSystemTab(): string {
  try {
    return localStorage.getItem(SYSTEM_TAB_KEY) || "hub";
  } catch {
    return "hub";
  }
}

function writeSystemTab(tabId: string): void {
  try {
    localStorage.setItem(SYSTEM_TAB_KEY, tabId);
  } catch {}
}

function renderSystemTabs(activeId: string, onSelect: (id: string) => void): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "cxTabs";
  getSystemTabs().forEach((t) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = t.id === activeId ? "cxTab cxTab--active" : "cxTab";
    btn.textContent = t.label;
    btn.onclick = () => onSelect(t.id);
    wrap.appendChild(btn);
  });
  return wrap;
}

export function renderSystemPage(root: HTMLElement): void {
  const role = getRole();
  const safeMode = getSafeMode();

  if (!canAccess(role, safeMode)) {
    recordObs({ code: OBS.WARN_SECTION_BLOCKED, page: "system", section: "page", detail: "rbac" });
    renderAccessDenied(root, "RBAC_PAGE_BLOCKED");
    return;
  }

  const model = createSystemModel();
  const sections: SectionSpec[] = [
    { id: "system-overview", title: "Overview", render: (host) => renderSystemOverview(host) },
    { id: "system-hub", title: "System Hub", render: (host) => renderSystemHub(host) },
    { id: "system-plans", title: "Plans", render: (host) => renderSystemPlans(host) },
    { id: "system-subscriptions", title: "Abonnements", render: (host) => renderSystemSubscriptions(host) },
    { id: "system-health-charts", title: "Analyse et santé du système", render: (host) => renderSystemHealthCharts(host) },
    { id: "system-chart-gallery", title: "Galerie graphiques", render: (host) => renderChartGallery(host) },
    { id: "system-safe-mode", title: "Mode sûr", render: (host) => renderSystemSafeMode(host, model) },
    { id: "system-cache-audit", title: "Audit cache", render: (host) => renderSystemCacheAudit(host) },
    { id: "system-safe-mode-actions", title: "Actions mode sûr", render: (host) => renderSystemSafeModeActions(host, role) },
    { id: "system-flags", title: "Drapeaux", render: (host) => renderSystemFlags(host, model) },
    { id: "system-flags-actions", title: "Actions drapeaux", render: (host) => renderSystemFlagsActions(host, role, () => renderSystemPage(root)) },
    { id: "system-layout", title: "Disposition", render: (host) => renderSystemLayout(host, model) }
  ];

  safeRender(root, () => {
    root.innerHTML = "";
    const activeId = readSystemTab();
    const tabs = getSystemTabs();
    const activeTab = tabs.find((t) => t.id === activeId) || tabs[0];
    const { shell, header, content } = createPageShell({
      title: "Système",
      subtitle: "Configuration, santé et drapeaux",
      safeMode: mapSafeMode(safeMode)
    });
    const tabsRow = renderSystemTabs(activeTab.id, (id) => {
      writeSystemTab(id);
      renderSystemPage(root);
    });
    header.appendChild(tabsRow);
    root.appendChild(shell);
    const filtered = sections.filter((s) => activeTab.sectionIds.includes(s.id));
    mountSections(content, filtered, { page: "system", role, safeMode });
  });
}

export const systemSections = [
  "system-health-charts",
  "system-chart-gallery",
  "system-safe-mode",
  "system-safe-mode-actions",
  "system-flags",
  "system-flags-actions",
  "system-layout"
];
