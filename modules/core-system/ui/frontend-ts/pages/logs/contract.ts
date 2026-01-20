import type { Role } from "/src/runtime/rbac";
import type { SafeModeValue as SafeMode } from "/src/core/runtime/safe";

export const PAGE_ID = "logs";
export const SAFE_MODE_ALLOWED = true;
export const REQUIRED_ROLES: Role[] = ["ADMIN", "SYSADMIN", "DEVELOPER"];

export function canAccess(role: Role, safeMode: SafeMode): boolean {
  // Master a toujours accès à tout
  if (role === "MASTER") return true;
  if (safeMode === "STRICT" && !SAFE_MODE_ALLOWED) return false;
  return REQUIRED_ROLES.includes(role);
}
