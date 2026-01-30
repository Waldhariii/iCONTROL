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
  footer.classList.add("ic-cp-da39a3ee5e");
const safeModeValue = mapSafeMode(getSafeMode());
  footer.appendChild(createBadge(`SAFE_MODE: ${safeModeValue}`, safeModeValue === "STRICT" ? "err" : safeModeValue === "COMPAT" ? "warn" : "ok"));
  footer.appendChild(createBadge("AUDIT ENABLED", "info"));

  const last = document.createElement("div");
  last.textContent = "Dernière modification gouvernée: " + (lastModified != null ? formatRelative(lastModified) : "—");
  last.classList.add("ic-cp-51b3bc2f4f");
  footer.appendChild(last);

  return footer;
}

/** Bandeau « Données de démonstration » à placer en haut du contenu quand isCpDemoEnabled(). */
export function createDemoDataBanner(): HTMLElement | null {
  if (!isCpDemoEnabled()) return null;
  const banner = document.createElement("div");
  banner.classList.add("ic-cp-da39a3ee5e");
banner.setAttribute("role", "status");
  banner.textContent = "Données de démonstration";
  return banner;
}

export function createTwoColumnLayout(): HTMLElement {
  const grid = document.createElement("div");
  grid.classList.add("ic-cp-da39a3ee5e");
return grid;
}

export function createKpis(items: Array<{ label: string; value: string; tone?: "ok" | "warn" | "err" | "info" | "neutral" }>): HTMLElement {
  return createKpiStrip(items);
}
