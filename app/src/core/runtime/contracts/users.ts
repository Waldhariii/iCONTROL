import type { Role } from "/src/runtime/rbac";
import type { SafeModeValue } from "/src/core/runtime/safe";

export const PAGE_ID = "users";
export const SAFE_MODE_ALLOWED = true;
export const REQUIRED_ROLES: Role[] = ["ADMIN", "SYSADMIN", "DEVELOPER"];

export function canAccess(role: Role, safeMode: SafeModeValue): boolean {
  if (role === "MASTER") return true;
  if (safeMode === "STRICT" && !SAFE_MODE_ALLOWED) return false;
  return REQUIRED_ROLES.includes(role);
}
