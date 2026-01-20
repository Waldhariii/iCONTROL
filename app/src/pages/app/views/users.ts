/**
 * ICONTROL_APP_USERS_VIEW_V1
 * Vues d'utilisateurs pour l'application CLIENT (/app)
 * Complètement indépendant de CP
 */
import type { UsersModelApp } from "../models/users";
import { appendList, appendTable, sectionCard } from "../../../../../modules/core-system/ui/frontend-ts/pages/_shared/uiBlocks";

export function renderUsersOverviewApp(root: HTMLElement, model: UsersModelApp): void {
  const card = sectionCard(model.title);
  appendList(card, [
    "Gestion des utilisateurs de l'application client.",
    "Roles et permissions spécifiques au client.",
    "Menu access limité aux fonctionnalités client."
  ]);
  root.appendChild(card);
}

export function renderUsersRolesApp(root: HTMLElement, model: UsersModelApp): void {
  const card = sectionCard("Roles catalog - Client");
  appendTable(
    card,
    ["Role"],
    model.roles.map((role) => ({ Role: role }))
  );
  root.appendChild(card);
}

export function renderUsersPermissionsApp(root: HTMLElement, model: UsersModelApp): void {
  const card = sectionCard("Role permissions - Client");
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

export function renderUsersMenuAccessApp(root: HTMLElement, model: UsersModelApp): void {
  const card = sectionCard("Menu access - Client (roles)");
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
