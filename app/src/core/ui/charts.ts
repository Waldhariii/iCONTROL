/**
 * ICONTROL_CHARTS_V1
 * Lightweight SVG charts for CP visualisation (no business logic).
 */
type ChartSeries = { label?: string; value: number; color?: string };

function createSvg(width: number, height: number): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.style.display = "block";
  return svg;
}

export function createLineChart(data: number[], width = 320, height = 140): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "width:100%;";
  const svg = createSvg(width, height);
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = width / Math.max(data.length - 1, 1);

  const points = data
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * (height - 20) - 10;
      return `${x},${y}`;
    })
    .join(" ");

  const polyline = document.createElementNS(svg.namespaceURI, "polyline");
  polyline.setAttribute("points", points);
  polyline.setAttribute("fill", "none");
  polyline.setAttribute("stroke", "var(--ic-accent, #7b2cff)");
  polyline.setAttribute("stroke-width", "2");
  svg.appendChild(polyline);

  wrapper.appendChild(svg);
  return wrapper;
}

export function createBarChart(data: number[], width = 320, height = 140): HTMLElement {
  const wrapper = document.createElement("div");
  const svg = createSvg(width, height);
  const max = Math.max(...data, 1);
  const barWidth = width / data.length;

  data.forEach((v, i) => {
    const barHeight = (v / max) * (height - 20);
    const rect = document.createElementNS(svg.namespaceURI, "rect");
    rect.setAttribute("x", String(i * barWidth + 6));
    rect.setAttribute("y", String(height - barHeight - 10));
    rect.setAttribute("width", String(barWidth - 12));
    rect.setAttribute("height", String(barHeight));
    rect.setAttribute("rx", "4");
    rect.setAttribute("fill", "var(--ic-accent2, #7c3aed)");
    svg.appendChild(rect);
  });

  wrapper.appendChild(svg);
  return wrapper;
}

export function createDonutChart(series: ChartSeries[], size = 160): HTMLElement {
  const wrapper = document.createElement("div");
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
    circle.setAttribute("stroke", s.color || ["#4ec9b0", "#f59e0b", "#f48771", "#7b2cff"][idx % 4]);
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
  hole.setAttribute("fill", "var(--ic-card, #1a1d1f)");
  svg.appendChild(hole);

  wrapper.appendChild(svg);
  return wrapper;
}
