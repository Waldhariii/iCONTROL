/**
 * ICONTROL_USER_PERMISSIONS_V1
 * Système de permissions personnalisées par utilisateur
 */
import type { Role } from "../localAuth";

export type PageId = "dashboard" | "account" | "users" | "management" | "settings" | "toolbox" | "dossiers";

export type UserPermissions = {
  pages: PageId[];
  canManageUsers?: boolean;
  canManagePermissions?: boolean;
};

const LS_KEY = "icontrol_user_permissions_v1";

// Permissions par défaut selon le rôle
const DEFAULT_PERMISSIONS: Record<string, UserPermissions> = {
  MASTER: {
    pages: ["dashboard", "account", "users", "management", "settings", "toolbox", "dossiers"],
    canManageUsers: true,
    canManagePermissions: true,
  },
  DEVELOPER: {
    pages: ["dashboard", "account"], // Par défaut, seulement Dashboard et Compte
    canManageUsers: false,
    canManagePermissions: false,
  },
  SYSADMIN: {
    pages: ["dashboard", "account", "users", "management", "settings"],
    canManageUsers: true,
    canManagePermissions: false,
  },
  ADMIN: {
    pages: ["dashboard", "account", "users"],
    canManageUsers: false,
    canManagePermissions: false,
  },
  USER: {
    pages: ["dashboard", "account"],
    canManageUsers: false,
    canManagePermissions: false,
  },
};

export function getUserPermissions(username: string, role: Role): UserPermissions {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      // Retourner les permissions par défaut
      const roleUpper = role.toUpperCase();
      return DEFAULT_PERMISSIONS[roleUpper] || DEFAULT_PERMISSIONS.USER;
    }
    const all = JSON.parse(raw) as Record<string, UserPermissions>;
    return all[username] || DEFAULT_PERMISSIONS[role.toUpperCase()] || DEFAULT_PERMISSIONS.USER;
  } catch {
    const roleUpper = role.toUpperCase();
    return DEFAULT_PERMISSIONS[roleUpper] || DEFAULT_PERMISSIONS.USER;
  }
}

export function setUserPermissions(username: string, permissions: UserPermissions): void {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, UserPermissions>) : {};
    all[username] = permissions;
    localStorage.setItem(LS_KEY, JSON.stringify(all));
  } catch (e) {
    console.warn("Erreur lors de la sauvegarde des permissions:", e);
  }
}

export function canAccessPage(username: string, role: Role, page: PageId): boolean {
  // Master a toujours accès à tout
  if (username === "Master" || role === "MASTER") {
    return true;
  }
  
  const permissions = getUserPermissions(username, role);
  return permissions.pages.includes(page);
}

export function canManageUsers(username: string, role: Role): boolean {
  // Master peut toujours gérer les utilisateurs
  if (username === "Master" || role === "MASTER") {
    return true;
  }
  
  const permissions = getUserPermissions(username, role);
  return permissions.canManageUsers === true;
}

export function canManagePermissions(username: string, role: Role): boolean {
  // Master peut gérer les permissions de tous
  if (username === "Master" || role === "MASTER") {
    return true;
  }
  
  // Developer peut gérer les permissions des autres Developer
  if (username === "Developpeur" || role === "DEVELOPER") {
    return true;
  }
  
  return false;
}

export function getAllUserPermissions(): Record<string, UserPermissions> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, UserPermissions>;
  } catch {
    return {};
  }
}
