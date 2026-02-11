/**
 * RBAC helper — runtime
 * Goal:
 * - ADMIN/SYSADMIN/DEVELOPER can see Settings in menu
 * - USER must never see it
 * - Keep logic centralized to avoid drift
 */
import { getSession } from "../localAuth";

export type Role = "USER" | "ADMIN" | "SYSADMIN" | "DEVELOPER";

const RBAC_PERMS_KEY = "icontrol_rbac_permissions_v1";

type RbacStore = {
  roles?: Record<string, string[]>;
};

const DEFAULT_ROLE_PERMS: Record<Role, string[]> = {
  USER: [],
  ADMIN: [
    "cp.access.settings",
    "cp.access.branding",
    "cp.access.theme_studio",
    "cp.access.tenants",
    "cp.pages.create",
    "cp.pages.update",
    "cp.branding.write",
    "cp.tenants.write",
    "cp.users.manage",
  ],
  SYSADMIN: [
    "cp.access.settings",
    "cp.access.branding",
    "cp.access.theme_studio",
    "cp.access.tenants",
    "cp.access.providers",
    "cp.access.policies",
    "cp.access.security",
    "cp.access.toolbox",
    "cp.pages.create",
    "cp.pages.update",
    "cp.pages.delete",
    "cp.pages.publish",
    "cp.pages.activate",
    "cp.pages.sync",
    "cp.providers.write",
    "cp.policies.write",
    "cp.security.write",
    "cp.branding.write",
    "cp.tenants.write",
    "cp.users.manage",
    "cp.theme.write",
  ],
  DEVELOPER: [
    "cp.access.settings",
    "cp.access.branding",
    "cp.access.theme_studio",
    "cp.access.tenants",
    "cp.access.providers",
    "cp.access.policies",
    "cp.access.security",
    "cp.access.toolbox",
    "cp.pages.create",
    "cp.pages.update",
    "cp.providers.write",
    "cp.policies.write",
    "cp.security.write",
    "cp.branding.write",
    "cp.tenants.write",
    "cp.users.manage",
    "cp.theme.write",
  ],
};

function readRbacStore(): RbacStore | null {
  try {
    const raw = localStorage.getItem(RBAC_PERMS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as RbacStore) : null;
  } catch {
    return null;
  }
}

export function getRole(): Role {
  try {
    const s = getSession();
    const r = String((s as any)?.role || "USER").toUpperCase();
    if (r === "ADMIN" || r === "SYSADMIN" || r === "DEVELOPER") return r as Role;
    return "USER";
  } catch {
    return "USER";
  }
}

export function getPermissionClaims(): string[] {
  const role = getRole();
  const store = readRbacStore();
  const rolePerms = store?.roles?.[role];
  if (Array.isArray(rolePerms)) {
    return rolePerms.map(String);
  }
  return DEFAULT_ROLE_PERMS[role] || [];
}

export function hasPermission(permission: string): boolean {
  const claims = getPermissionClaims();
  return claims.includes(permission);
}

export function canSeeSettings(): boolean {
  if (hasPermission("cp.access.settings")) return true;
  const r = getRole();
  return r === "ADMIN" || r === "SYSADMIN" || r === "DEVELOPER";
}

export function canAccessSettings(): boolean {
  // For now identical, but kept separate for future policy granularity
  return canSeeSettings();
}

export function canAccessBranding(): boolean {
  if (hasPermission("cp.access.branding")) return true;
  const r = getRole();
  return r === "ADMIN" || r === "SYSADMIN" || r === "DEVELOPER";
}

export function canAccessThemeStudio(): boolean {
  if (hasPermission("cp.access.theme_studio")) return true;
  const r = getRole();
  return r === "ADMIN" || r === "SYSADMIN" || r === "DEVELOPER";
}

export function canAccessTenants(): boolean {
  if (hasPermission("cp.access.tenants")) return true;
  const r = getRole();
  return r === "ADMIN" || r === "SYSADMIN" || r === "DEVELOPER";
}

export function canAccessProviders(): boolean {
  if (hasPermission("cp.access.providers")) return true;
  const r = getRole();
  return r === "SYSADMIN" || r === "DEVELOPER";
}

export function canAccessPolicies(): boolean {
  if (hasPermission("cp.access.policies")) return true;
  const r = getRole();
  return r === "SYSADMIN" || r === "DEVELOPER";
}

export function canAccessSecurity(): boolean {
  if (hasPermission("cp.access.security")) return true;
  const r = getRole();
  return r === "SYSADMIN" || r === "DEVELOPER";
}

export function canAccessToolbox(): boolean {
  if (hasPermission("cp.access.toolbox")) return true;
  const r = getRole();
  return r === "SYSADMIN" || r === "DEVELOPER";
}

export function canWriteProviders(): boolean {
  return hasPermission("cp.providers.write");
}

export function canWritePolicies(): boolean {
  return hasPermission("cp.policies.write");
}

export function canWriteSecurity(): boolean {
  return hasPermission("cp.security.write");
}

export function canWriteTenants(): boolean {
  return hasPermission("cp.tenants.write");
}

export function canWriteBranding(): boolean {
  return hasPermission("cp.branding.write");
}

export function canManageUsers(): boolean {
  return hasPermission("cp.users.manage");
}

export function canWriteTheme(): boolean {
  return hasPermission("cp.theme.write");
}
