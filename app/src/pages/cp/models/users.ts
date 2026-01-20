/**
 * ICONTROL_CP_USERS_MODEL_V1
 * Modèle d'utilisateurs pour l'application ADMINISTRATION (/cp)
 * Complètement indépendant de APP
 */

export type UsersPermissionRowCp = {
  moduleId: string;
  role: string;
  permissions: string[];
};

export type UsersMenuAccessRowCp = {
  menuId: string;
  label: string;
  roles: string[];
};

export type UsersModelCp = {
  title: string;
  roles: string[];
  permissions: UsersPermissionRowCp[];
  menuAccess: UsersMenuAccessRowCp[];
};

export function createUsersModelCp(): UsersModelCp {
  const roles = ["ADMIN", "SYSADMIN", "DEVELOPER"].sort();
  
  const permissions: UsersPermissionRowCp[] = [
    { moduleId: "CORE_SYSTEM", role: "ADMIN", permissions: ["read", "write"] },
    { moduleId: "CORE_SYSTEM", role: "SYSADMIN", permissions: ["read", "write", "admin"] },
    { moduleId: "CORE_SYSTEM", role: "DEVELOPER", permissions: ["read", "write", "admin", "dev"] },
    { moduleId: "SYSTEM_LOGS", role: "ADMIN", permissions: ["read"] },
    { moduleId: "SYSTEM_LOGS", role: "SYSADMIN", permissions: ["read", "write"] },
    { moduleId: "SYSTEM_LOGS", role: "DEVELOPER", permissions: ["read", "write", "admin"] }
  ];

  const menuAccess: UsersMenuAccessRowCp[] = [
    { menuId: "dashboard", label: "Dashboard", roles: ["ADMIN", "SYSADMIN", "DEVELOPER"] },
    { menuId: "system", label: "Système", roles: ["SYSADMIN", "DEVELOPER"] },
    { menuId: "logs", label: "Logs", roles: ["SYSADMIN", "DEVELOPER"] },
    { menuId: "developer", label: "Développeur", roles: ["SYSADMIN", "DEVELOPER"] },
    { menuId: "users", label: "Utilisateurs", roles: ["ADMIN", "SYSADMIN", "DEVELOPER"] },
    { menuId: "account", label: "Compte", roles: ["ADMIN", "SYSADMIN", "DEVELOPER"] }
  ];

  return {
    title: "Utilisateurs - Administration",
    roles,
    permissions,
    menuAccess
  };
}
