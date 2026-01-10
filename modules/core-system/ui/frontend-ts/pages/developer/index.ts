import { getRole } from "/src/runtime/rbac";
import { getSafeMode } from "/src/core/studio/internal/policy";
import { renderAccessDenied, safeRender } from "../_shared/mainSystem.shared";
import { mountSections, type SectionSpec } from "../_shared/sections";
import { canAccess } from "./contract";
import { createDeveloperModel } from "./model";
import {
  renderDeveloperDatasources,
  renderDeveloperFormContract,
  renderDeveloperOverview,
  renderDeveloperTableContract,
  renderDeveloperToolbox
} from "./view";

export function renderDeveloper(root: HTMLElement): void {
  const role = getRole();
  const safeMode = getSafeMode();

  if (!canAccess(role, safeMode)) {
    renderAccessDenied(root);
    return;
  }

  const model = createDeveloperModel();
  const sections: SectionSpec[] = [
    {
      id: "developer-overview",
      title: model.title,
      render: (host) => renderDeveloperOverview(host, model)
    },
    {
      id: "developer-toolbox",
      title: "Toolbox",
      render: (host) => renderDeveloperToolbox(host)
    },
    {
      id: "developer-table-contract",
      title: "Table contract",
      render: (host) => renderDeveloperTableContract(host, model)
    },
    {
      id: "developer-form-contract",
      title: "Form contract",
      render: (host) => renderDeveloperFormContract(host, model)
    },
    {
      id: "developer-datasources",
      title: "Datasource types",
      render: (host) => renderDeveloperDatasources(host, model)
    }
  ];

  safeRender(root, () => {
    root.innerHTML = "";
    mountSections(root, sections, { page: "developer", role, safeMode });
  });
}

export const developerSections = [
  "developer-overview",
  "developer-toolbox",
  "developer-table-contract",
  "developer-form-contract",
  "developer-datasources"
];
