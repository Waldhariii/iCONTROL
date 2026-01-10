import { getRole } from "/src/runtime/rbac";
import { renderAccessDenied, safeRender } from "../_shared/mainSystem.shared";
import { mountSections, type SectionSpec } from "../_shared/sections";
import { recordObs } from "../_shared/audit";
import { OBS } from "../_shared/obsCodes";
import { getSafeMode } from "../_shared/safeMode";
import { canAccess } from "./contract";
import { createSystemModel } from "./model";
import { renderSystemFlags } from "./sections/flags";
import { renderSystemLayout } from "./sections/layout";
import { renderSystemSafeMode } from "./sections/safe-mode";

export function renderSystemPage(root: HTMLElement): void {
  const role = getRole();
  const safeMode = getSafeMode();

  if (!canAccess(role, safeMode)) {
    recordObs({ code: OBS.WARN_SECTION_BLOCKED, page: "system", section: "page", detail: "rbac" });
    renderAccessDenied(root);
    return;
  }

  const model = createSystemModel();
  const sections: SectionSpec[] = [
    { id: "system-safe-mode", title: "SAFE_MODE", render: (host) => renderSystemSafeMode(host, model) },
    { id: "system-flags", title: "Flags", render: (host) => renderSystemFlags(host, model) },
    { id: "system-layout", title: "Layout", render: (host) => renderSystemLayout(host, model) }
  ];

  safeRender(root, () => {
    root.innerHTML = "";
    mountSections(root, sections, { page: "system", role, safeMode });
  });
}

export const systemSections = ["system-safe-mode", "system-flags", "system-layout"];
