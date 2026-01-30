/**
 * ICONTROL_KPI_V1
 * KPI cards and strips for CP visual pages.
 */
type KpiTone = "ok" | "warn" | "err" | "info" | "neutral";
type KpiTrend = "up" | "down" | "neutral";

export interface KpiCardOptions {
  label: string;
  value: string;
  tone?: KpiTone;
  trend?: KpiTrend;
  unit?: string;
  target?: string;
  lastUpdated?: string;
  /** Affichage type Enterprise: valeur en plus grand, carte légèrement plus marquée */
  hero?: boolean;
}

export function createKpiCard(labelOrOpts: string | KpiCardOptions, value?: string, tone: KpiTone = "neutral"): HTMLElement {
  const opts: KpiCardOptions = typeof labelOrOpts === "string"
    ? { label: labelOrOpts, value: value ?? "", tone }
    : { tone: "neutral", ...labelOrOpts };

  const card = document.createElement("div");
  const isHero = !!opts.hero;
  card.className = "ic-kpi";
  card.dataset.hero = isHero ? "1" : "0";
  if (opts.tone && opts.tone !== "neutral") {
    card.dataset.tone = opts.tone;
  } else if (opts.trend === "up") {
    card.dataset.tone = "ok";
  } else if (opts.trend === "down") {
    card.dataset.tone = "err";
  }

  const title = document.createElement("div");
  title.textContent = opts.label;
  title.className = "ic-kpi__title";
  card.appendChild(title);

  const valRow = document.createElement("div");
  valRow.className = "ic-kpi__valrow";
  const val = document.createElement("span");
  const valueStr = opts.unit?.trim() ? `${opts.value} ${opts.unit.trim()}` : opts.value;
  val.textContent = valueStr;
  val.className = "ic-kpi__value";
  valRow.appendChild(val);

  if (opts.trend) {
    const arrow = document.createElement("span");
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = opts.trend === "up" ? "▲" : opts.trend === "down" ? "▼" : "−";
    arrow.className = "ic-kpi__trend";
    valRow.appendChild(arrow);
  }

  card.appendChild(valRow);
  if (opts.target) {
    const t = document.createElement("div");
    t.textContent = `Cible: ${opts.target}`;
    t.className = "ic-kpi__meta";
    card.appendChild(t);
  }
  if (opts.lastUpdated) {
    const u = document.createElement("div");
    u.textContent = opts.lastUpdated;
    u.className = "ic-kpi__meta";
    card.appendChild(u);
  }

  if (opts.target) {
    const valueNum = Number(String(opts.value).replace(/[^0-9.\-]/g, ""));
    const targetNum = Number(String(opts.target).replace(/[^0-9.\-]/g, ""));
    if (Number.isFinite(valueNum) && Number.isFinite(targetNum) && targetNum > 0) {
      const strip = document.createElement("div");
      strip.className = "ic-kpi__strip";
      const fill = document.createElement("div");
      fill.className = "ic-kpi__stripFill";
      const pct = Math.max(0, Math.min(100, (valueNum / targetNum) * 100));
      fill.style.width = `${pct}%`;
      strip.appendChild(fill);
      card.appendChild(strip);
    }
  }

  return card;
}

export function createKpiStrip(items: Array<{ label: string; value: string; tone?: KpiTone; trend?: KpiTrend; unit?: string; target?: string; lastUpdated?: string; hero?: boolean }>): HTMLElement {
  const strip = document.createElement("div");
  strip.className = "ic-kpi-strip";
  items.forEach((item) => strip.appendChild(createKpiCard({ label: item.label, value: item.value, tone: item.tone, trend: item.trend, unit: item.unit, target: item.target, lastUpdated: item.lastUpdated, hero: item.hero })));
  return strip;
}
