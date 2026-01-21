import { createBadge } from "/src/core/ui/badge";
import { createKpiStrip } from "/src/core/ui/kpi";
import { getSafeMode } from "../../../../../modules/core-system/ui/frontend-ts/pages/_shared/safeMode";

export function mapSafeMode(value: string): "OFF" | "COMPAT" | "STRICT" {
  if (value === "STRICT") return "STRICT";
  if (value === "COMPAT") return "COMPAT";
  return "OFF";
}

export function createGovernanceFooter(): HTMLElement {
  const footer = document.createElement("div");
  footer.style.cssText = `
    margin-top: 16px;
    padding: 12px 16px;
    border: 1px solid var(--ic-border, #2b3136);
    background: var(--ic-panel, #1a1d1f);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  `;

  const safeModeValue = mapSafeMode(getSafeMode());
  footer.appendChild(createBadge(`SAFE_MODE: ${safeModeValue}`, safeModeValue === "STRICT" ? "err" : safeModeValue === "COMPAT" ? "warn" : "ok"));
  footer.appendChild(createBadge("AUDIT ENABLED", "info"));

  const last = document.createElement("div");
  last.textContent = "Derniere modification gouvernee: --";
  last.style.cssText = "font-size: 11px; color: var(--ic-mutedText, #a7b0b7);";
  footer.appendChild(last);

  return footer;
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
