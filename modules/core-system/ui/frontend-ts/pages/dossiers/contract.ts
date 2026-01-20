import type { Role } from "/src/runtime/rbac";
import type { SafeModeValue as SafeMode } from "/src/core/runtime/safe";

export const PAGE_ID = "dossiers";
export const SAFE_MODE_ALLOWED = true;
export const REQUIRED_ROLES: Role[] = ["SYSADMIN", "DEVELOPER", "ADMIN"];
export const WRITE_ROLES: Role[] = ["SYSADMIN", "DEVELOPER", "ADMIN"];

export function canAccess(role: Role, safeMode: SafeMode): boolean {
  // Master a toujours accès à tout
  if (role === "MASTER") return true;
  if (safeMode === "STRICT" && !SAFE_MODE_ALLOWED) return false;
  return REQUIRED_ROLES.includes(role);
}

export function canWrite(role: Role): boolean {
  // Master peut toujours écrire
  if (role === "MASTER") return true;
  return WRITE_ROLES.includes(role);
}
