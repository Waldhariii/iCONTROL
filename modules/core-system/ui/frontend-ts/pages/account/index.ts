import { getRole } from "/src/runtime/rbac";
import { getSafeMode } from "/src/core/studio/internal/policy";
import { renderAccessDenied, safeRender } from "../_shared/mainSystem.shared";
import { mountSections, type SectionSpec } from "../_shared/sections";
import { canAccess } from "./contract";
import { createAccountModel } from "./model";
import {
  renderAccountSettingsKeys,
  renderAccountStorageAllow,
  renderAccountSummary
} from "./view";

export function renderAccount(root: HTMLElement): void {
  const role = getRole();
  const safeMode = getSafeMode();

  if (!canAccess(role, safeMode)) {
    renderAccessDenied(root);
    return;
  }

  const model = createAccountModel();
  const sections: SectionSpec[] = [
    {
      id: "account-summary",
      title: model.title,
      render: (host) => renderAccountSummary(host, model)
    },
    {
      id: "account-settings-keys",
      title: "Settings keys",
      render: (host) => renderAccountSettingsKeys(host, model)
    },
    {
      id: "account-storage-allow",
      title: "Storage allow list",
      render: (host) => renderAccountStorageAllow(host, model)
    }
  ];

  safeRender(root, () => {
    root.innerHTML = "";
    mountSections(root, sections, { page: "account", role, safeMode });
  });
}

export const accountSections = [
  "account-summary",
  "account-settings-keys",
  "account-storage-allow"
];
