import type { UsersModel } from "./model";
import { appendList, appendTable, sectionCard } from "../_shared/uiBlocks";

export function renderUsersOverview(root: HTMLElement, model: UsersModel): void {
  const card = sectionCard(model.title);
  appendList(card, [
    "Roles references are derived from module registry.",
    "Permissions table mirrors CORE_SYSTEM/M_DOSSIERS mappings.",
    "Menu access lists roles per menu item."
  ]);
  root.appendChild(card);
}

export function renderUsersRoles(root: HTMLElement, model: UsersModel): void {
  const card = sectionCard("Roles catalog");
  appendTable(
    card,
    ["Role"],
    model.roles.map((role) => ({ Role: role }))
  );
  root.appendChild(card);
}

export function renderUsersPermissions(root: HTMLElement, model: UsersModel): void {
  const card = sectionCard("Role permissions (modules)");
  appendTable(
    card,
    ["Module", "Role", "Permissions"],
    model.permissions.map((row) => ({
      Module: row.moduleId,
      Role: row.role,
      Permissions: row.permissions.join(", ")
    }))
  );
  root.appendChild(card);
}

export function renderUsersMenuAccess(root: HTMLElement, model: UsersModel): void {
  const card = sectionCard("Menu access (roles)");
  appendTable(
    card,
    ["Menu", "Label", "Roles"],
    model.menuAccess.map((row) => ({
      Menu: row.menuId,
      Label: row.label,
      Roles: row.roles.join(", ")
    }))
  );
  root.appendChild(card);
}
