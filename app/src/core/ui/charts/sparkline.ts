import { createSvgRoot, getChartColor, type ChartTone } from "./chartTokens";

export function createSparkline(options: {
  values: number[];
  width?: number;
  height?: number;
  tone?: ChartTone;
}): HTMLElement {
  const width = options.width ?? 160;
  const height = options.height ?? 40;
  const tone = options.tone ?? "accent";
  const values = options.values.length ? options.values : [8, 6, 9, 7, 10, 12, 9, 11, 10];

  const wrapper = document.createElement("div");
  const svg = createSvgRoot(width, height);

  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const step = width / (values.length - 1);

  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * (height - 6) - 3;
    return `${x},${y}`;
  });

  const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  polyline.setAttribute("points", points.join(" "));
  polyline.setAttribute("fill", "none");
  polyline.setAttribute("stroke", getChartColor(tone));
  polyline.setAttribute("stroke-width", "2");
  polyline.setAttribute("stroke-linecap", "round");
  polyline.setAttribute("stroke-linejoin", "round");
  svg.appendChild(polyline);

  wrapper.appendChild(svg);
  return wrapper;
}
