/**
 * RBAC helper — runtime
 * Goal:
 * - ADMIN/SYSADMIN/DEVELOPER can see Settings in menu
 * - USER must never see it
 * - Keep logic centralized to avoid drift
 */
import { getSession } from "../localAuth";

export type Role = "USER" | "ADMIN" | "SYSADMIN" | "DEVELOPER";

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

export function canSeeSettings(): boolean {
  const r = getRole();
  return r === "ADMIN" || r === "SYSADMIN" || r === "DEVELOPER";
}

export function canAccessSettings(): boolean {
  // For now identical, but kept separate for future policy granularity
  return canSeeSettings();
}
