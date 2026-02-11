// @ts-nocheck
import type { Role } from "/src/runtime/rbac";
import type { SafeMode } from "../_shared/safeMode";

export const PAGE_ID = "dossiers";
export const SAFE_MODE_ALLOWED = true;
export const REQUIRED_ROLES: Role[] = ["SYSADMIN", "DEVELOPER", "ADMIN"];
export const WRITE_ROLES: Role[] = ["SYSADMIN", "DEVELOPER", "ADMIN"];

export function canAccess(role: Role, safeMode: SafeMode): boolean {
  if (safeMode === "STRICT" && !SAFE_MODE_ALLOWED) return false;
  return REQUIRED_ROLES.includes(role);
}

export function canWrite(role: Role): boolean {
  return WRITE_ROLES.includes(role);
}
