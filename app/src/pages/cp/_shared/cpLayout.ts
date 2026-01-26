import { createBadge } from "/src/core/ui/badge";
import { createKpiStrip } from "/src/core/ui/kpi";
import { formatRelative, type DateInput } from "/src/core/utils/dateFormat";
import { getSafeMode } from "../../../../../modules/core-system/ui/frontend-ts/pages/_shared/safeMode";
import { isCpDemoEnabled } from "./cpDemo";

export function mapSafeMode(value: string): "OFF" | "COMPAT" | "STRICT" {
  if (value === "STRICT") return "STRICT";
  if (value === "COMPAT") return "COMPAT";
  return "OFF";
}

export function createGovernanceFooter(lastModified?: DateInput): HTMLElement {
  const footer = document.createElement("div");
  footer.style.cssText = `
    margin-top: var(--space-16, 16px);
    padding: var(--space-12, 12px) var(--space-16, 16px);
    border: 1px solid var(--ic-border, #2b3136);
    background: var(--ic-panel, #1a1d1f);
    border-radius: var(--radius-md, 10px);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-12, 12px);
    flex-wrap: wrap;
  `;

  const safeModeValue = mapSafeMode(getSafeMode());
  footer.appendChild(createBadge(`SAFE_MODE: ${safeModeValue}`, safeModeValue === "STRICT" ? "err" : safeModeValue === "COMPAT" ? "warn" : "ok"));
  footer.appendChild(createBadge("AUDIT ENABLED", "info"));

  const last = document.createElement("div");
  last.textContent = "Dernière modification gouvernée: " + (lastModified != null ? formatRelative(lastModified) : "—");
  last.style.cssText = "font-size: var(--text-xs, 11px); color: var(--ic-mutedText, #a7b0b7);";
  footer.appendChild(last);

  return footer;
}

/** Bandeau « Données de démonstration » à placer en haut du contenu quand isCpDemoEnabled(). */
export function createDemoDataBanner(): HTMLElement | null {
  if (!isCpDemoEnabled()) return null;
  const banner = document.createElement("div");
  banner.style.cssText = `
    display: flex; align-items: center; gap: 10px;
    padding: 10px 14px; border-radius: var(--radius-sm, 8px);
    background: var(--ic-warnBg, rgba(245,158,11,0.15));
    border: 1px solid var(--ic-warnBorder, rgba(245,158,11,0.4));
    color: var(--ic-warn, #f59e0b); font-size: var(--text-sm, 12px); font-weight: 600;
  `;
  banner.setAttribute("role", "status");
  banner.textContent = "Données de démonstration";
  return banner;
}

export function createTwoColumnLayout(): HTMLElement {
  const grid = document.createElement("div");
  grid.style.cssText = `
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    gap: 16px;
    width: 100%;
  `;
  return grid;
}

export function createKpis(items: Array<{ label: string; value: string; tone?: "ok" | "warn" | "err" | "info" | "neutral" }>): HTMLElement {
  return createKpiStrip(items);
}
