export function mapSafeMode(value: string): "OFF" | "COMPAT" | "STRICT" {
  const v = (value || "").toUpperCase();
  if (v === "STRICT") return "STRICT";
  if (v === "COMPAT") return "COMPAT";
  return "OFF";
}

export function createGovernanceFooter(lastUpdated?: string): HTMLElement {
  const el = document.createElement("div");
  el.className = "ic-governance-footer";
  const ts = lastUpdated ? ` · ${lastUpdated}` : "";
  el.textContent = `Governance · SAFE_MODE${ts}`;
  return el;
}

export function createDemoDataBanner(): HTMLElement {
  return null as unknown as HTMLElement;
}
