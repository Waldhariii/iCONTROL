/**
 * ICONTROL_BADGE_V1
 * Badges de statut, rôles et SAFE_MODE
 */
export type BadgeTone = "neutral" | "info" | "ok" | "warn" | "err" | "accent";

const TONE_STYLES: Record<BadgeTone, { bg: string; border: string; text: string }> = {
  neutral: { bg: "rgba(255,255,255,0.06)", border: "var(--ic-border, #2b3136)", text: "var(--ic-text, #e7ecef)" },
  info: { bg: "rgba(59,130,246,0.15)", border: "rgba(59,130,246,0.4)", text: "#9cdcfe" },
  ok: { bg: "rgba(78,201,176,0.15)", border: "rgba(78,201,176,0.4)", text: "#4ec9b0" },
  warn: { bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.4)", text: "#f59e0b" },
  err: { bg: "rgba(244,135,113,0.15)", border: "rgba(244,135,113,0.4)", text: "#f48771" },
  accent: { bg: "rgba(123,44,255,0.15)", border: "rgba(123,44,255,0.4)", text: "#cfc6ff" }
};

export function createBadge(label: string, tone: BadgeTone = "neutral"): HTMLElement {
  const badge = document.createElement("span");
  const style = TONE_STYLES[tone];
  badge.textContent = label;
  badge.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 999px;
    background: ${style.bg};
    border: 1px solid ${style.border};
    color: ${style.text};
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.2px;
    text-transform: uppercase;
  `;
  return badge;
}

export function createSafeModeBadge(mode: "OFF" | "COMPAT" | "STRICT"): HTMLElement {
  if (mode === "STRICT") return createBadge("SAFE_MODE: STRICT", "err");
  if (mode === "COMPAT") return createBadge("SAFE_MODE: COMPAT", "warn");
  return createBadge("SAFE_MODE: OFF", "ok");
}

export function createRoleBadge(role: string): HTMLElement {
  const normalized = String(role || "").toUpperCase();
  if (normalized === "MASTER") return createBadge("MASTER", "accent");
  if (normalized === "SYSADMIN") return createBadge("SYSADMIN", "info");
  if (normalized === "DEVELOPER") return createBadge("DEVELOPER", "accent");
  if (normalized === "ADMIN") return createBadge("ADMIN", "ok");
  return createBadge(normalized || "USER", "neutral");
}
