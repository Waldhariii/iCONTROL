import { getRole } from "/src/runtime/rbac";
import { createPageShell } from "/src/core/ui/pageShell";
import { safeRender } from "../_shared/mainSystem.shared";
import { mountSections, type SectionSpec } from "../_shared/sections";
import { recordObs } from "../_shared/audit";
import { OBS } from "../_shared/obsCodes";
import { getSafeMode } from "../_shared/safeMode";
import { renderAccessDenied } from "../_shared/renderAccessDenied";
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

function mapSafeMode(s: string): "OFF" | "COMPAT" | "STRICT" {
  return s === "STRICT" ? "STRICT" : s === "COMPAT" ? "COMPAT" : "OFF";
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
    const { shell, content } = createPageShell({
      title: "Système",
      subtitle: "Configuration, santé et drapeaux",
      safeMode: mapSafeMode(safeMode)
    });
    root.appendChild(shell);
    mountSections(content, sections, { page: "system", role, safeMode });
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
