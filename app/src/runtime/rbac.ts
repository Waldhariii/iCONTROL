/**
 * RBAC helper — runtime
 * Goal:
 * - ADMIN/SYSADMIN/DEVELOPER can see Settings in menu
 * - USER must never see it
 * - Keep logic centralized to avoid drift
 */
import { getSession } from "../localAuth";
import { canAccessPage } from "../core/permissions/userPermissions";

export type Role = "USER" | "ADMIN" | "SYSADMIN" | "DEVELOPER" | "MASTER";

export function getRole(): Role {
  try {
    const s = getSession();
    if (!s) return "USER";
    
    // ICONTROL_MASTER_ROLE_V1: Master est toujours reconnu comme MASTER par son username
    if ((s as any).username === "Master") {
      return "MASTER" as Role;
    }
    
    const r = String((s as any)?.role || "USER").toUpperCase();
    if (r === "ADMIN" || r === "SYSADMIN" || r === "DEVELOPER" || r === "MASTER") return r as Role;
    return "USER";
  } catch {
    return "USER";
  }
}

export function canSeeSettings(): boolean {
  const s = getSession();
  if (!s) return false;
  const r = getRole();
  // Master a toujours accès
  if (r === "MASTER" || ((s as any).username === "Master" && r === "SYSADMIN")) {
    return true;
  }
  return canAccessPage((s as any).username, r, "settings");
}

export function canAccessSettings(): boolean {
  // For now identical, but kept separate for future policy granularity
  return canSeeSettings();
}

// ICONTROL_TOOLBOX_REMOVED_V1: Fonction canAccessToolbox supprimée (Toolbox complètement retirée)

export function canAccessPageRoute(page: string): boolean {
  const s = getSession();
  if (!s) return false;
  const r = getRole();
  const username = (s as any).username;
  
  // Master a toujours accès à tout
  if (r === "MASTER" || (username === "Master" && r === "SYSADMIN")) {
    return true;
  }
  
  return canAccessPage(username, r, page as any);
}
