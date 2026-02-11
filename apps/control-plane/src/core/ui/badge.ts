/**
 * ICONTROL_BADGE_V1
 * Badges de statut, rôles et SAFE_MODE
 */
export type BadgeTone = "neutral" | "info" | "ok" | "warn" | "err" | "accent";

export function createBadge(label: string, tone: BadgeTone = "neutral"): HTMLElement {
  const badge = document.createElement("span");
  badge.textContent = label;
  badge.className = "ic-badge";
  badge.dataset["tone"] = tone;
  return badge;
}

export function createSafeModeBadge(mode: "OFF" | "COMPAT" | "STRICT"): HTMLElement {
  if (mode === "STRICT") return createBadge("SAFE_MODE: STRICT", "err");
  if (mode === "COMPAT") return createBadge("SAFE_MODE: COMPAT", "warn");
  return createBadge("SAFE_MODE: OFF", "ok");
}

const ROLE_LABELS_FR: Record<string, string> = {
  MASTER: "Maître",
  SYSADMIN: "Admin système",
  DEVELOPER: "Développeur",
  ADMIN: "Admin",
  USER: "Utilisateur",
};

/** @param locale "fr" | "en" — "fr" pour libellés localisés (Maître, Admin système, …). */
export function createRoleBadge(role: string, locale: "fr" | "en" = "fr"): HTMLElement {
  const normalized = String(role || "").toUpperCase();
  const label = locale === "fr" && ROLE_LABELS_FR[normalized]
    ? ROLE_LABELS_FR[normalized]
    : (normalized || "USER");
  if (normalized === "MASTER") return createBadge(label, "accent");
  if (normalized === "SYSADMIN") return createBadge(label, "info");
  if (normalized === "DEVELOPER") return createBadge(label, "accent");
  if (normalized === "ADMIN") return createBadge(label, "ok");
  return createBadge(label, "neutral");
}
