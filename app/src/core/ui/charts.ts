/**
 * ICONTROL_CHARTS_V1
 * Lightweight SVG charts for CP visualisation (no business logic).
 * + createChartCard, createStackedBarChart, createAreaChart, getChartColor.
 */
import { createSectionCard } from "./sectionCard";

export type ChartSeries = { label?: string; value: number; color?: string };

export interface LineChartOptions { width?: number; height?: number; title?: string; }
export interface BarChartOptions { width?: number; height?: number; title?: string; }
export interface DonutChartOptions { size?: number; title?: string; }
export interface GaugeChartOptions { size?: number; label?: string; segments?: { to: number; color: string }[]; }

function createSvg(width: number, height: number): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", String(height));
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.style.display = "block";
  svg.style.maxWidth = "100%";
  return svg;
}

function addText(svg: SVGSVGElement, x: number, y: number, text: string, className?: string): void {
  const el = document.createElementNS(svg.namespaceURI, "text");
  el.setAttribute("x", String(x));
  el.setAttribute("y", String(y));
  el.setAttribute("fill", "var(--ic-mutedText)");
  el.setAttribute("font-size", "10");
  el.textContent = text;
  if (className) el.setAttribute("class", className);
  svg.appendChild(el);
}

export function createLineChart(data: number[], widthOrOpts: number | LineChartOptions = 320, height?: number): HTMLElement {
  const opts: LineChartOptions = typeof widthOrOpts === "object" ? widthOrOpts : { width: widthOrOpts, height };
  const width = opts.width ?? 320;
  const h = opts.height ?? height ?? 140;

  const wrapper = document.createElement("div");
  wrapper.className = "ic-chart";
  if (opts.title) {
    const cap = document.createElement("div");
    cap.textContent = opts.title;
    cap.className = "ic-chart__cap";
    wrapper.appendChild(cap);
  }
  const svg = createSvg(width, h);
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const marginLeft = 28;
  const marginRight = 8;
  const marginTop = 12;
  const marginBottom = 20;
  const plotW = width - marginLeft - marginRight;
  const plotH = h - marginTop - marginBottom;
  const stepX = data.length > 1 ? plotW / (data.length - 1) : plotW;

  const linePoints = data.map((v, i) => {
    const x = marginLeft + i * stepX;
    const y = marginTop + plotH - ((v - min) / range) * plotH;
    return { x, y };
  });
  const pointsStr = linePoints.map((p) => `${p.x},${p.y}`).join(" ");
  const bottomY = h - marginBottom;
  const areaPoints = [
    `${marginLeft},${bottomY}`,
    ...linePoints.map((p) => `${p.x},${p.y}`),
    `${marginLeft + (data.length - 1) * stepX},${bottomY}`
  ].join(" ");

  const area = document.createElementNS(svg.namespaceURI, "polygon");
  area.setAttribute("points", areaPoints);
  area.setAttribute("fill", "var(--ic-chartArea, var(--ic-text-primary))");
  area.setAttribute("stroke", "none");
  svg.appendChild(area);

  const polyline = document.createElementNS(svg.namespaceURI, "polyline");
  polyline.setAttribute("points", pointsStr);
  polyline.setAttribute("fill", "none");
  polyline.setAttribute("stroke", "var(--ic-chartPrimary, var(--ic-accent))");
  polyline.setAttribute("stroke-width", "2");
  polyline.setAttribute("stroke-linecap", "round");
  polyline.setAttribute("stroke-linejoin", "round");
  svg.appendChild(polyline);

  addText(svg, 4, h - marginBottom + 4, String(min));
  addText(svg, 4, marginTop + 4, String(max));

  wrapper.appendChild(svg);
  return wrapper;
}

export function createBarChart(data: number[], widthOrOpts: number | BarChartOptions = 320, height?: number): HTMLElement {
  const opts: BarChartOptions = typeof widthOrOpts === "object" ? widthOrOpts : { width: widthOrOpts, height };
  const width = opts.width ?? 320;
  const h = opts.height ?? height ?? 140;

  const wrapper = document.createElement("div");
  wrapper.className = "ic-chart";
  if (opts.title) {
    const cap = document.createElement("div");
    cap.textContent = opts.title;
    cap.className = "ic-chart__cap";
    wrapper.appendChild(cap);
  }
  const svg = createSvg(width, h);
  const max = Math.max(...data, 1);
  const marginLeft = 8;
  const marginRight = 8;
  const marginBottom = 20;
  const plotW = width - marginLeft - marginRight;
  const plotH = h - marginBottom - 8;
  const barWidth = data.length ? plotW / data.length - 4 : 0;

  data.forEach((v, i) => {
    const barHeight = (v / max) * plotH;
    const rect = document.createElementNS(svg.namespaceURI, "rect");
    rect.setAttribute("x", String(marginLeft + i * (plotW / data.length) + 2));
    rect.setAttribute("y", String(h - marginBottom - barHeight));
    rect.setAttribute("width", String(Math.max(2, barWidth)));
    rect.setAttribute("height", String(barHeight));
    rect.setAttribute("rx", "4");
    rect.setAttribute("fill", "var(--ic-chartPrimary, var(--ic-accent))");
    rect.setAttribute("title", String(v));
    svg.appendChild(rect);
  });

  addText(svg, marginLeft, h - 4, "0");
  wrapper.appendChild(svg);
  return wrapper;
}

export interface StackedBarChartOptions { width?: number; height?: number; title?: string; }

/**
 * Barres empilées — plusieurs séries par catégorie.
 * data[série][index] : chaque série a le même nombre d’éléments.
 * Couleurs : --ic-chartPrimary, --ic-chartSecondary, --ic-chartTertiary, --ic-chartQuaternary.
 */
export function createStackedBarChart(
  data: number[][],
  widthOrOpts: number | StackedBarChartOptions = 320,
  height?: number
): HTMLElement {
  const opts: StackedBarChartOptions = typeof widthOrOpts === "object" ? widthOrOpts : { width: widthOrOpts, height };
  const width = opts.width ?? 320;
  const h = opts.height ?? height ?? 140;

  const CHART_FILLS = ["var(--ic-chartPrimary)", "var(--ic-chartSecondary)", "var(--ic-chartTertiary)", "var(--ic-chartQuaternary)"];

  const wrapper = document.createElement("div");
  wrapper.className = "ic-chart";
  if (opts.title) {
    const cap = document.createElement("div");
    cap.textContent = opts.title;
    cap.className = "ic-chart__cap";
    wrapper.appendChild(cap);
  }

  const n = data[0]?.length ?? 0;
  const sums = Array.from({ length: n }, (_, i) => data.reduce((acc, s) => acc + (s[i] ?? 0), 0));
  const max = Math.max(...sums, 1);

  const svg = createSvg(width, h);
  const marginLeft = 8;
  const marginRight = 8;
  const marginBottom = 20;
  const plotW = width - marginLeft - marginRight;
  const plotH = h - marginBottom - 8;
  const slotW = n ? plotW / n : 0;
  const barWidth = Math.max(2, slotW - 4);

  for (let i = 0; i < n; i++) {
    let offsetY = 0;
    data.forEach((series, si) => {
      const v = series[i] ?? 0;
      const barHeight = (v / max) * plotH;
      const rect = document.createElementNS(svg.namespaceURI, "rect");
      rect.setAttribute("x", String(marginLeft + i * slotW + 2));
      rect.setAttribute("y", String(h - marginBottom - offsetY - barHeight));
      rect.setAttribute("width", String(barWidth));
      rect.setAttribute("height", String(barHeight));
      rect.setAttribute("rx", "4");
// @ts-ignore FOUNDATION_SHIM_CHARTS (string|undefined normalization pending)
      rect.setAttribute("fill", CHART_FILLS[si % CHART_FILLS.length]);
      rect.setAttribute("title", String(v));
      svg.appendChild(rect);
      offsetY += barHeight;
    });
  }

  addText(svg, marginLeft, h - 4, "0");
  wrapper.appendChild(svg);
  return wrapper;
}

/**
 * Courbe avec surface remplie — même rendu que createLineChart.
 * Nom sémantique pour tendances / volumes (style Enterprise).
 */
export function createAreaChart(
  data: number[],
  widthOrOpts: number | LineChartOptions = 320,
  height?: number
): HTMLElement {
  return createLineChart(data, widthOrOpts, height);
}

/** Palette des graphiques (bleu, vert, or, violet) — pour graphiques personnalisés. */
export const CHART_PALETTE = [
  "var(--ic-chartPrimary)",
  "var(--ic-chartSecondary)",
  "var(--ic-chartTertiary)",
  "var(--ic-chartQuaternary)"
] as const;

/** Couleur de la palette par index (cycle si dépassement). */
export function getChartColor(index: number): string {
// @ts-ignore FOUNDATION_SHIM_CHARTS (string|undefined normalization pending)
  return CHART_PALETTE[Math.abs(index) % CHART_PALETTE.length];
}

/** Options pour createChartCard selon le type. */
export type ChartCardOptions = {
  title: string;
  description?: string;
  icon?: string;
} & (
  | { type: "line"; data: number[]; width?: number; height?: number }
  | { type: "bar"; data: number[]; width?: number; height?: number }
  | { type: "stackedBar"; data: number[][]; width?: number; height?: number }
  | { type: "area"; data: number[]; width?: number; height?: number }
  | { type: "donut"; series: ChartSeries[]; size?: number }
  | { type: "gauge"; value: number; max: number; label?: string; segments?: { to: number; color: string }[]; size?: number }
);

/**
 * Carte avec graphique intégré — même visuel que l’image Enterprise (titre, description, chart).
 * Permet d’ajouter des graphiques en une seule appel, style unifié.
 *
 * @example
 * createChartCard({ type: "line", title: "Trafic", description: "Requêtes/h", data: [10,20,15,30] })
 * createChartCard({ type: "donut", title: "Statut", series: [{ label: "OK", value: 70 }, { label: "WARN", value: 30 }] })
 * createChartCard({ type: "gauge", title: "CPU", value: 65, max: 100, label: "CPU %" })
 */
export function createChartCard(options: ChartCardOptions): HTMLElement {
  const { card, body } = createSectionCard({
    title: options.title,
    description: options.description,
    icon: options.icon
  });

  switch (options.type) {
    case "line":
      body.appendChild(createLineChart(options.data, { width: options.width ?? 320, height: options.height ?? 140 }));
      break;
    case "bar":
      body.appendChild(createBarChart(options.data, { width: options.width ?? 320, height: options.height ?? 140 }));
      break;
    case "stackedBar":
      body.appendChild(createStackedBarChart(options.data, { width: options.width ?? 320, height: options.height ?? 140 }));
      break;
    case "area":
      body.appendChild(createAreaChart(options.data, { width: options.width ?? 320, height: options.height ?? 140 }));
      break;
    case "donut":
      body.appendChild(createDonutChart(options.series, { size: options.size ?? 160 }));
      break;
    case "gauge":
      body.appendChild(
        createGaugeChart(options.value, options.max, {
          label: options.label,
          segments: options.segments,
          size: options.size ?? 160
        })
      );
      break;
  }

  return card;
}

export function createDonutChart(series: ChartSeries[], sizeOrOpts: number | DonutChartOptions = 160): HTMLElement {
  const opts: DonutChartOptions = typeof sizeOrOpts === "object" ? sizeOrOpts : { size: sizeOrOpts };
  const size = opts.size ?? 160;

  const wrapper = document.createElement("div");
  wrapper.className = "ic-chart ic-chart__center";
  if (opts.title) {
    const cap = document.createElement("div");
    cap.textContent = opts.title;
    cap.className = "ic-chart__cap";
    wrapper.appendChild(cap);
  }
  const svg = createSvg(size, size);
  const radius = size / 2 - 14;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const total = series.reduce((sum, s) => sum + s.value, 0) || 1;

  series.forEach((s, idx) => {
    const value = s.value / total;
    const dash = value * circumference;
    const circle = document.createElementNS(svg.namespaceURI, "circle");
    circle.setAttribute("cx", String(size / 2));
    circle.setAttribute("cy", String(size / 2));
    circle.setAttribute("r", String(radius));
    circle.setAttribute("fill", "transparent");
// @ts-ignore FOUNDATION_SHIM_CHARTS (string|undefined normalization pending)
    circle.setAttribute("stroke", s.color || ["var(--ic-success)", "var(--ic-warn)", "var(--ic-error)", "var(--ic-chartQuaternary)"][idx % 4]);
    circle.setAttribute("stroke-width", "14");
    circle.setAttribute("stroke-dasharray", `${dash} ${circumference - dash}`);
    circle.setAttribute("stroke-dashoffset", String(-offset));
    circle.setAttribute("transform", `rotate(-90 ${size / 2} ${size / 2})`);
    svg.appendChild(circle);
    offset += dash;
  });

  const hole = document.createElementNS(svg.namespaceURI, "circle");
  hole.setAttribute("cx", String(size / 2));
  hole.setAttribute("cy", String(size / 2));
  hole.setAttribute("r", String(radius - 16));
  hole.setAttribute("fill", "var(--ic-card)");
  svg.appendChild(hole);

  wrapper.appendChild(svg);

  const legend = document.createElement("div");
  legend.className = "ic-chart__legend";
  series.forEach((s, idx) => {
    const pct = total ? Math.round((s.value / total) * 100) : 0;
    const item = document.createElement("div");
    item.className = "ic-chart__legendItem";
    const swatch = document.createElement("span");
    swatch.className = "ic-chart__swatch";
    if (s.color) swatch.style.backgroundColor = s.color;
    else swatch.dataset.series = String(idx % 4);
    item.appendChild(swatch);
    const txt = document.createElement("span");
    txt.textContent = (s.label || "") + " " + pct + "%";
    item.appendChild(txt);
    legend.appendChild(item);
  });
  wrapper.appendChild(legend);

  return wrapper;
}

/** Jauge semi-circulaire: value/max. segments (optionnel) colorent des plages [0, to]. */
export function createGaugeChart(value: number, max: number, labelOrOpts?: string | GaugeChartOptions): HTMLElement {
  const opts: GaugeChartOptions = typeof labelOrOpts === "string" ? { label: labelOrOpts } : (labelOrOpts || {});
  const size = opts.size ?? 160;
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;

  const wrapper = document.createElement("div");
  wrapper.className = "ic-chart ic-chart__center";
  if (opts.label) {
    const cap = document.createElement("div");
    cap.textContent = opts.label;
    cap.className = "ic-chart__cap";
    wrapper.appendChild(cap);
  }
  const svg = createSvg(size, size / 2 + 20);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 12;

  const segs = opts.segments && opts.segments.length ? opts.segments : [{ to: 100, color: "var(--ic-accent)" }];
  const fillColor = (() => {
    const pct = ratio * 100;
    for (const s of segs) {
      if (pct <= s.to) return s.color;
    }
    return segs[segs.length - 1]?.color || "var(--ic-accent)";
  })();

  const pathBg = document.createElementNS(svg.namespaceURI, "path");
  pathBg.setAttribute("d", `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`);
  pathBg.setAttribute("fill", "none");
  pathBg.setAttribute("stroke", "var(--ic-border)");
  pathBg.setAttribute("stroke-width", "10");
  svg.appendChild(pathBg);

  const angle = ratio * 180;
  const rad = (angle * Math.PI) / 180;
  const x2 = cx + r * Math.cos(Math.PI - rad);
  const y2 = cy + r * Math.sin(Math.PI - rad);
  const pathVal = document.createElementNS(svg.namespaceURI, "path");
  pathVal.setAttribute("d", `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${x2} ${y2}`);
  pathVal.setAttribute("fill", "none");
  pathVal.setAttribute("stroke", fillColor);
  pathVal.setAttribute("stroke-width", "10");
  pathVal.setAttribute("stroke-linecap", "round");
  svg.appendChild(pathVal);

  const valText = document.createElementNS(svg.namespaceURI, "text");
  valText.setAttribute("x", String(cx));
  valText.setAttribute("y", String(cy + 6));
  valText.setAttribute("text-anchor", "middle");
  valText.setAttribute("fill", "var(--ic-text)");
  valText.setAttribute("font-size", "16");
  valText.setAttribute("font-weight", "700");
  valText.textContent = String(value);
  svg.appendChild(valText);

  wrapper.appendChild(svg);
  return wrapper;
}
