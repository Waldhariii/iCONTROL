import type { Role } from "/src/runtime/rbac";
import type { SafeMode } from "/src/core/studio/internal/policy";

export const PAGE_ID = "developer";
export const SAFE_MODE_ALLOWED = true;
export const REQUIRED_ROLES: Role[] = ["DEVELOPER", "SYSADMIN"];

export function canAccess(role: Role, safeMode: SafeMode): boolean {
  if (safeMode === "STRICT" && !SAFE_MODE_ALLOWED) return false;
  return REQUIRED_ROLES.includes(role);
}
