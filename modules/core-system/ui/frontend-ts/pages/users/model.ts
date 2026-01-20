import { MAIN_SYSTEM_MODULES, MAIN_SYSTEM_PERMISSIONS } from "../../shared/mainSystem.data";

export type UsersPermissionRow = {
  moduleId: string;
  role: string;
  permissions: string[];
};

export type UsersMenuAccessRow = {
  menuId: string;
  label: string;
  roles: string[];
};

export type UsersModel = {
  title: string;
  roles: string[];
  permissions: UsersPermissionRow[];
  menuAccess: UsersMenuAccessRow[];
};

export function createUsersModel(): UsersModel {
  const roles = Array.from(
    new Set(MAIN_SYSTEM_MODULES.flatMap((mod) => mod.roles))
  ).sort();

  const permissions: UsersPermissionRow[] = [];
  Object.entries(MAIN_SYSTEM_PERMISSIONS).forEach(([moduleId, mapping]) => {
    Object.entries(mapping).forEach(([role, perms]) => {
      permissions.push({ moduleId, role, permissions: perms });
    });
  });

  const menuAccess: UsersMenuAccessRow[] = MAIN_SYSTEM_MODULES.flatMap((mod) =>
    mod.menu.map((entry) => ({
      menuId: entry.id,
      label: entry.label,
      roles: entry.roles
    }))
  );

  return {
    title: "Utilisateurs",
    roles,
    permissions,
    menuAccess
  };
}
