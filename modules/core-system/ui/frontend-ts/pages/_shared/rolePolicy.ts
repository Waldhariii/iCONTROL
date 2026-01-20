export type Role = "SYSADMIN" | "ADMIN" | "DEVELOPER" | "USER" | "MASTER";

export type PageId =
  | "dashboard"
  | "account"
  | "parametres"
  | "developer"
  | "dossiers"
  | "system"
  | "logs"
  | "verification";

export type SectionId =
  | "toolbox-rules"
  | "toolbox-audit-log"
  | "dossiers-list"
  | "dossiers-detail"
  | "dossiers-create"
  | "settings-account"
  | "settings-system";

export type SafeMode = "STRICT" | "COMPAT";

export type PolicyDecision =
  | { allow: true }
  | { allow: false; reason: string };

export const POLICY_MARKER = "ICONTROL_POLICY_SSOT_V1";

/**
 * Page-level RBAC: "can you enter this route/page?"
 */
export function canAccessPage(role: Role, page: PageId): PolicyDecision {
  // Master a toujours accès à tout
  if (role === "MASTER") {
    return { allow: true };
  }
  
  // USER role is restricted for privileged pages
  if (role === "USER") {
    if (page === "dashboard" || page === "account") return { allow: true };
    return { allow: false, reason: "RBAC_PAGE_USER_BLOCKED" };
  }

  // ADMIN policy: deny developer page by default (as per policy)
  if (role === "ADMIN") {
    if (page === "developer") return { allow: false, reason: "RBAC_PAGE_ADMIN_BLOCKED" };
  }

  // SYSADMIN + DEVELOPER can access most internal pages
  return { allow: true };
}

/**
 * Section-level RBAC: "once on the page, can you see this section?"
 * Note: must NOT override page-level deny; callers should check page first.
 */
export function canAccessSection(role: Role, section: SectionId): PolicyDecision {
  // Master a toujours accès à toutes les sections
  if (role === "MASTER") {
    return { allow: true };
  }
  
  // Developer toolbox rules is SYSADMIN-only (policy)
  if (section === "toolbox-rules") {
    return role === "SYSADMIN"
      ? { allow: true }
      : { allow: false, reason: "RBAC_SECTION_SYSADMIN_ONLY" };
  }

  // Default: privileged roles can see most sections; USER is limited
  if (role === "USER") return { allow: false, reason: "RBAC_SECTION_USER_BLOCKED" };

  return { allow: true };
}

/**
 * SAFE_MODE write gating: "can we write now?"
 * actionId should be stable (ex: "dossier.create", "dossier.state", etc.)
 */
export function isWriteAllowed(safeMode: SafeMode, actionId: string): PolicyDecision {
  if (safeMode === "STRICT") {
    return { allow: false, reason: `SAFE_MODE_STRICT_WRITE_BLOCKED:${actionId}` };
  }
  return { allow: true };
}
