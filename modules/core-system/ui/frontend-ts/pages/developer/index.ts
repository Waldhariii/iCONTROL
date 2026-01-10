import { getRole } from "/src/runtime/rbac";
import { getSafeMode } from "/src/core/studio/internal/policy";
import { renderAccessDenied, safeRender } from "../_shared/mainSystem.shared";
import { mountSections, type SectionSpec } from "../_shared/sections";
import { canAccess } from "./contract";
import { render_registry_viewer } from "./sections/registry-viewer";
import { render_contracts_table } from "./sections/contracts-table";
import { render_contracts_form } from "./sections/contracts-form";
import { render_datasources_viewer } from "./sections/datasources-viewer";
import { render_rules_viewer } from "./sections/rules-viewer";
import { render_audit_log } from "./sections/audit-log";

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
    {
      id: "toolbox-datasources",
      title: "Datasources",
      render: (host) => render_datasources_viewer(host, safeMode),
      requiresRoles: ["SYSADMIN", "DEVELOPER"]
    },
    {
      id: "toolbox-rules",
      title: "Rules",
      render: (host) => render_rules_viewer(host),
      requiresRole: "SYSADMIN"
    },
    {
      id: "toolbox-audit-log",
      title: "Audit log",
      render: (host) => render_audit_log(host),
      requiresRoles: ["SYSADMIN", "DEVELOPER"]
    }
  ];

  safeRender(root, () => {
    root.innerHTML = "";
    mountSections(root, sections, { page: "developer", role, safeMode });
  });
}

export const developerSections = [
  "toolbox-registry-viewer",
  "toolbox-contracts-table",
  "toolbox-contracts-form",
  "toolbox-datasources",
  "toolbox-rules",
  "toolbox-audit-log"
];
