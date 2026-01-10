import { getRole } from "/src/runtime/rbac";
import { getSafeMode } from "/src/core/studio/internal/policy";
import { renderAccessDenied, safeRender } from "../_shared/mainSystem.shared";
import { mountSections, type SectionSpec } from "../_shared/sections";
import { canAccess } from "./contract";
import { render_registry_viewer } from "./sections/registry-viewer";
import { render_contracts_table } from "./sections/contracts-table";
import { render_contracts_form } from "./sections/contracts-form";

export function renderDeveloper(root: HTMLElement): void {
  const role = getRole();
  const safeMode = getSafeMode();

  if (!canAccess(role, safeMode)) {
    renderAccessDenied(root);
    return;
  }

  const sections: SectionSpec[] = [
    {
      id: "toolbox-registry-viewer",
      title: "Registry viewer",
      render: (host) => render_registry_viewer(host),
      requiresRoles: ["SYSADMIN", "DEVELOPER"]
    },
    {
      id: "toolbox-contracts-table",
      title: "Contracts: TableDef",
      render: (host) => render_contracts_table(host),
      requiresRoles: ["SYSADMIN", "DEVELOPER"]
    },
    {
      id: "toolbox-contracts-form",
      title: "Contracts: FormDef",
      render: (host) => render_contracts_form(host),
      requiresRoles: ["SYSADMIN", "DEVELOPER"]
    },
    // Datasources + rules sections added in Wave 3 (part 2).
  ];

  safeRender(root, () => {
    root.innerHTML = "";
    mountSections(root, sections, { page: "developer", role, safeMode });
  });
}

export const developerSections = [
  "toolbox-registry-viewer",
  "toolbox-contracts-table",
  "toolbox-contracts-form"
];
