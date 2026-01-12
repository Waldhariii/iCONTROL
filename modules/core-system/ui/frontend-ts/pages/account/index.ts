import { getRole } from "/src/runtime/rbac";
import { getSafeMode } from "../_shared/safeMode";
import { renderAccessDenied, safeRender } from "../_shared/mainSystem.shared";
import { mountSections, type SectionSpec } from "../_shared/sections";
import { canAccess } from "./contract";
import { createAccountModel } from "./model";
import {
renderAccountSettingsKeys,
  renderAccountStorageAllow,
  renderAccountStorageUsage,
  renderAccountSummary
} from "./view";
import * as EntitlementsFacade from "../_shared/entitlements";

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
    },
    {
      id: "account-storage-usage",
      title: "Storage usage",
      render: (host) => renderAccountStorageUsage(host, model)
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
  "account-storage-allow",
  "account-storage-usage"
];

// ICONTROL_ENTITLEMENTS_WIRING_V1
// Enterprise-grade baseline: UI/pages must depend ONLY on entitlements facade (never on subscription write-model).
// This is intentionally minimal: we create a stable seam for future UI panels without coupling.
export async function __icResolveEntitlementsForAccountPage(tenantId: string, nowIso: string) {
  return await (EntitlementsFacade as any).getEntitlementsForTenant(tenantId, nowIso);
}
