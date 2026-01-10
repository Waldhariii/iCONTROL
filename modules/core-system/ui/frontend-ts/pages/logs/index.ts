import { getRole } from "/src/runtime/rbac";
import { renderAccessDenied, safeRender } from "../_shared/mainSystem.shared";
import { mountSections, type SectionSpec } from "../_shared/sections";
import { recordObs } from "../_shared/audit";
import { OBS } from "../_shared/obsCodes";
import { getSafeMode } from "../_shared/safeMode";
import { canAccess } from "./contract";
import { renderLogsAudit } from "./sections/audit-log";
import { renderLogsFilters } from "./sections/filters";
import { renderLogsExport } from "./sections/export";
import { renderLogsRetention } from "./sections/retention";

export function renderLogsPage(root: HTMLElement): void {
  const role = getRole();
  const safeMode = getSafeMode();

  if (!canAccess(role, safeMode)) {
    recordObs({ code: OBS.WARN_SECTION_BLOCKED, page: "logs", section: "page", detail: "rbac" });
    renderAccessDenied(root);
    return;
  }

  const sections: SectionSpec[] = [
    { id: "logs-filters", title: "Filtres", render: (host) => renderLogsFilters(host, () => renderLogsPage(root)) },
    { id: "logs-audit", title: "Audit log", render: (host) => renderLogsAudit(host) },
    { id: "logs-export", title: "Export", render: (host) => renderLogsExport(host, role) },
    { id: "logs-retention", title: "Retention", render: (host) => renderLogsRetention(host, role, () => renderLogsPage(root)) }
  ];

  safeRender(root, () => {
    root.innerHTML = "";
    mountSections(root, sections, { page: "logs", role, safeMode });
  });
}

export const logsSections = ["logs-filters", "logs-audit", "logs-export", "logs-retention"];
