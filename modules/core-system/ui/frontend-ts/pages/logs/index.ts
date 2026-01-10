import { getRole } from "/src/runtime/rbac";
import { renderAccessDenied, safeRender } from "../_shared/mainSystem.shared";
import { mountSections, type SectionSpec } from "../_shared/sections";
import { recordObs } from "../_shared/audit";
import { OBS } from "../_shared/obsCodes";
import { getSafeMode } from "../_shared/safeMode";
import { canAccess } from "./contract";
import { renderLogsAudit } from "./sections/audit-log";

export function renderLogsPage(root: HTMLElement): void {
  const role = getRole();
  const safeMode = getSafeMode();

  if (!canAccess(role, safeMode)) {
    recordObs({ code: OBS.WARN_SECTION_BLOCKED, page: "logs", section: "page", detail: "rbac" });
    renderAccessDenied(root);
    return;
  }

  const sections: SectionSpec[] = [
    { id: "logs-audit", title: "Audit log", render: (host) => renderLogsAudit(host) }
  ];

  safeRender(root, () => {
    root.innerHTML = "";
    mountSections(root, sections, { page: "logs", role, safeMode });
  });
}

export const logsSections = ["logs-audit"];
