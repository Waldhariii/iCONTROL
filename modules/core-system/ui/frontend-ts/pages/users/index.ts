import { getRole } from "/src/runtime/rbac";
import { getSafeMode } from "../_shared/safeMode";
import { renderAccessDenied, safeRender } from "../_shared/mainSystem.shared";
import { mountSections, type SectionSpec } from "../_shared/sections";
import { canAccess } from "./contract";
import { createUsersModel } from "./model";
import {
  renderUsersMenuAccess,
  renderUsersOverview,
  renderUsersPermissions,
  renderUsersRoles
} from "./view";
import * as EntitlementsFacade from "../_shared/entitlements";

export function renderUsers(root: HTMLElement): void {
  // ICONTROL_ENTITLEMENTS_WIRING_USERS_V1
  // Enterprise baseline: read-only entitlements (no subscription write-model in UI).
  const __icEntitlementsUsers = EntitlementsFacade.getEntitlementsForTenant("t1");
  void __icEntitlementsUsers;

  const role = getRole();
  const safeMode = getSafeMode();

  if (!canAccess(role, safeMode)) {
    renderAccessDenied(root);
    return;
  }

  const model = createUsersModel();
  const sections: SectionSpec[] = [
    {
      id: "users-overview",
      title: model.title,
      render: (host) => renderUsersOverview(host, model)
    },
    {
      id: "users-roles",
      title: "Roles catalog",
      render: (host) => renderUsersRoles(host, model)
    },
    {
      id: "users-permissions",
      title: "Role permissions",
      render: (host) => renderUsersPermissions(host, model)
    },
    {
      id: "users-menu-access",
      title: "Menu access",
      render: (host) => renderUsersMenuAccess(host, model)
    }
  ];

  safeRender(root, () => {
    root.innerHTML = "";
    mountSections(root, sections, { page: "users", role, safeMode });
  });
}

export const usersSections = [
  "users-overview",
  "users-roles",
  "users-permissions",
  "users-menu-access"
];
