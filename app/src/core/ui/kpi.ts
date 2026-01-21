/**
 * ICONTROL_KPI_V1
 * KPI cards and strips for CP visual pages.
 */
type KpiTone = "ok" | "warn" | "err" | "info" | "neutral";

export function createKpiCard(label: string, value: string, tone: KpiTone = "neutral"): HTMLElement {
  const card = document.createElement("div");
  const toneColor =
    tone === "ok"
      ? "var(--ic-success, #4ec9b0)"
      : tone === "warn"
      ? "var(--ic-warn, #f59e0b)"
      : tone === "err"
      ? "var(--ic-error, #f48771)"
      : tone === "info"
      ? "var(--ic-accent, #7b2cff)"
      : "var(--ic-mutedText, #a7b0b7)";
  card.style.cssText = `
    border: 1px solid var(--ic-border, #2b3136);
    background: var(--ic-card, #1a1d1f);
    border-radius: 12px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  `;

  const title = document.createElement("div");
  title.textContent = label;
  title.style.cssText = "font-size: 12px; color: var(--ic-mutedText, #a7b0b7);";
  const val = document.createElement("div");
  val.textContent = value;
  val.style.cssText = `font-size: 18px; font-weight: 700; color: ${toneColor};`;

  card.appendChild(title);
  card.appendChild(val);
  return card;
}

export function createKpiStrip(items: Array<{ label: string; value: string; tone?: KpiTone }>): HTMLElement {
  const strip = document.createElement("div");
  strip.style.cssText = `
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 12px;
    width: 100%;
  `;
  items.forEach((item) => strip.appendChild(createKpiCard(item.label, item.value, item.tone)));
  return strip;
}
