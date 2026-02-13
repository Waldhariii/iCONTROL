// @ts-nocheck
export type Role = "SYSADMIN" | "ADMIN" | "DEVELOPER" | "USER";

export type PageId =
  | "dashboard"
  | "account"
  | "parametres"
  | "developer"
  | "system"
  | "logs"
  | "verification";

export type SectionId =
  | "toolbox-rules"
  | "toolbox-audit-log"
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
  // USER role is restricted for privileged pages
  if (role === "USER") {
    if (page === "dashboard" || page === "account") return { allow: true };
    return { allow: false, reason: "RBAC_PAGE_USER_BLOCKED" };
  }

  // SYSADMIN + DEVELOPER can access most internal pages
  return { allow: true };
}

/**
 * Section-level RBAC: "once on the page, can you see this section?"
 * Note: must NOT override page-level deny; callers should check page first.
 */
export function canAccessSection(role: Role, section: SectionId): PolicyDecision {
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
