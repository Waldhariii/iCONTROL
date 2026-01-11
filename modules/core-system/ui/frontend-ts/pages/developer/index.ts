import { renderAccessDenied, safeRender } from "../_shared/mainSystem.shared";
import { mountSections, type SectionSpec } from "../_shared/sections";
import { renderRecommendations } from "../_shared/recommendations";
import { getRole, getSafeMode } from "../_shared/recommendations.ctx";
import { sectionCard } from "../_shared/uiBlocks";
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
      id: "developer-recommendations",
      title: "Recommandations",
      render: (host) => {
        renderRecommendations(host, {
          pageId: "developer",
          scopeId: "developer",
          role,
          safeMode
        });
      }
    },
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

  const isAllowedForRole = (section: SectionSpec): boolean => {
    if (section.requiresRoles) return section.requiresRoles.includes(role);
    if (section.requiresRole) return section.requiresRole === role;
    return true;
  };

  const allowedSections = sections.filter(isAllowedForRole);
  const hiddenSections = sections.filter((s) => !isAllowedForRole(s));

  safeRender(root, () => {
    root.innerHTML = "";
    if (hiddenSections.length > 0) {
      const card = sectionCard("Sections réservées");
      const note = document.createElement("div");
      note.style.cssText = "opacity:.8;margin-bottom:8px";
      note.textContent = "Certaines sections sont visibles uniquement pour SYSADMIN.";
      card.appendChild(note);
      const list = document.createElement("ul");
      list.style.cssText = "margin:0;padding-left:18px;opacity:.9";
      hiddenSections.forEach((s) => {
        const li = document.createElement("li");
        li.textContent = `${s.title} (${s.id})`;
        list.appendChild(li);
      });
      card.appendChild(list);
      root.appendChild(card);
    }
    mountSections(root, allowedSections, { page: "developer", role, safeMode });
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
