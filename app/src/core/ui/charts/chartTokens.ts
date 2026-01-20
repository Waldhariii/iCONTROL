export type ChartTone = "teal" | "purple" | "blue" | "muted" | "accent" | "ok" | "warn" | "err" | "info" | "neutral";

export function chartColor(tone: ChartTone): string {
  if (tone === "teal") return "var(--ic-accent, #35c2b8)";
  if (tone === "purple") return "var(--ic-accent2, #8b5cf6)";
  if (tone === "blue") return "var(--ic-blue, #60a5fa)";
  if (tone === "ok") return "var(--ic-success, #4ec9b0)";
  if (tone === "warn") return "var(--ic-warn, #f59e0b)";
  if (tone === "err") return "var(--ic-error, #f48771)";
  if (tone === "info") return "var(--ic-accent2, #6aa7ff)";
  if (tone === "accent") return "var(--ic-accent, #7b2cff)";
  if (tone === "neutral") return "var(--ic-text, #e7ecef)";
  return "var(--ic-mutedText, #a7b0b7)";
}

export function glassPanelCss(): string {
  return `
    background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03));
    border: 1px solid rgba(255,255,255,0.10);
    box-shadow: 0 10px 30px rgba(0,0,0,0.35);
    backdrop-filter: blur(10px);
  `;
}

export function getChartColor(tone: ChartTone): string {
  return chartColor(tone);
}

export function createSvgRoot(width: number, height: number): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("fill", "none");
  return svg;
}
