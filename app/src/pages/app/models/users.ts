/**
 * ICONTROL_APP_USERS_MODEL_V1
 * Modèle d'utilisateurs pour l'application CLIENT (/app)
 * Complètement indépendant de CP
 */

export type UsersPermissionRowApp = {
  moduleId: string;
  role: string;
  permissions: string[];
};

export type UsersMenuAccessRowApp = {
  menuId: string;
  label: string;
  roles: string[];
};

export type UsersModelApp = {
  title: string;
  roles: string[];
  permissions: UsersPermissionRowApp[];
  menuAccess: UsersMenuAccessRowApp[];
};

export function createUsersModelApp(): UsersModelApp {
  const roles = ["USER", "ADMIN"].sort();
  
  const permissions: UsersPermissionRowApp[] = [
    { moduleId: "CORE_SYSTEM", role: "USER", permissions: ["read"] },
    { moduleId: "CORE_SYSTEM", role: "ADMIN", permissions: ["read", "write"] },
    { moduleId: "M_DOSSIERS", role: "USER", permissions: ["read"] },
    { moduleId: "M_DOSSIERS", role: "ADMIN", permissions: ["read", "write"] }
  ];

  const menuAccess: UsersMenuAccessRowApp[] = [
    { menuId: "dashboard", label: "Dashboard", roles: ["USER", "ADMIN"] },
    { menuId: "dossiers", label: "Dossiers", roles: ["USER", "ADMIN"] },
    { menuId: "account", label: "Compte", roles: ["USER", "ADMIN"] }
  ];

  return {
    title: "Utilisateurs - Application Client",
    roles,
    permissions,
    menuAccess
  };
}
