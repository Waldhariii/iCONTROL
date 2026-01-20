import { getRole } from "/src/runtime/rbac";
import { safeRender, getSafeMode } from "/src/core/runtime/safe";
import { recordObs } from "/src/core/runtime/audit";
import { OBS } from "/src/core/runtime/obs";
import { renderAccessDenied } from "/src/core/runtime/accessDenied";
import { mountSections, type SectionSpec } from "../../shared/sections";
import { canAccess } from "./contract";
import { createSystemModel } from "./model";
import { renderSystemFlags } from "./sections/flags";
import { renderSystemLayout } from "./sections/layout";
import { renderSystemSafeMode } from "./sections/safe-mode";
import { renderSystemFlagsActions } from "./sections/flags-actions";
import { renderSystemSafeModeActions } from "./sections/safe-mode-actions";
import { renderSystemCacheAudit } from "./sections/cache-audit";

export function renderSystemPage(root: HTMLElement): void {
  renderSystemPageInternal(root);
}

function renderSystemPageInternal(root: HTMLElement): void {
  const role = getRole();
  const safeMode = getSafeMode();

  if (!canAccess(role, safeMode)) {
    recordObs({ code: OBS.WARN_SECTION_BLOCKED, page: "system", section: "page", detail: "rbac" });
    renderAccessDenied(root, "RBAC_PAGE_BLOCKED");
    return;
  }

  const model = createSystemModel();
  const refreshSystem = () => renderSystemPageInternal(root);
  const sections: SectionSpec[] = [
    { id: "system-safe-mode", title: "SAFE_MODE", render: (host) => renderSystemSafeMode(host, model) },
    { id: "system-cache-audit", title: "Cache Audit", render: (host) => renderSystemCacheAudit(host) },
    { id: "system-safe-mode-actions", title: "SAFE_MODE actions", render: (host) => renderSystemSafeModeActions(host, role) },
    { id: "system-flags", title: "Flags", render: (host) => renderSystemFlags(host, model) },
    { id: "system-flags-actions", title: "Flags actions", render: (host) => renderSystemFlagsActions(host, role, refreshSystem) },
    { id: "system-layout", title: "Layout", render: (host) => renderSystemLayout(host, model) }
  ];

  safeRender(root, () => {
    root.innerHTML = "";
    mountSections(root, sections, { page: "system", role, safeMode });
  });
}

export const systemSections = [
  "system-safe-mode",
  "system-safe-mode-actions",
  "system-flags",
  "system-flags-actions",
  "system-layout"
];
