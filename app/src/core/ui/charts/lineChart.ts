import { chartColor } from "./chartTokens";

export function createLineChart(opts: { values: number[]; width?: number; height?: number; yLabel?: string }): HTMLElement {
  const w = opts.width ?? 640;
  const h = opts.height ?? 120;
  const values = opts.values.length ? opts.values.slice(0, 60) : demo();
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = 10;

  const normY = (v: number) => {
    if (max === min) return h / 2;
    const t = (v - min) / (max - min);
    return (h - pad) - t * (h - 2 * pad);
  };

  const normX = (i: number) => {
    if (values.length <= 1) return pad;
    return pad + (i / (values.length - 1)) * (w - 2 * pad);
  };

  let d = "";
  values.forEach((v, i) => {
    const x = normX(i);
    const y = normY(v);
    d += (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1) + " ";
  });

  const wrap = document.createElement("div");
  wrap.style.cssText = "width:100%;";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", String(h));

  const grid = document.createElementNS(svg.namespaceURI, "path");
  grid.setAttribute("d", `M${pad} ${h - pad} L${w - pad} ${h - pad}`);
  grid.setAttribute("stroke", "rgba(255,255,255,0.12)");
  grid.setAttribute("stroke-width", "1");
  grid.setAttribute("fill", "none");

  const path = document.createElementNS(svg.namespaceURI, "path");
  path.setAttribute("d", d.trim());
  path.setAttribute("stroke", chartColor("blue"));
  path.setAttribute("stroke-width", "2");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke-linecap", "round");
  path.setAttribute("stroke-linejoin", "round");
  (path as any).style.filter = "drop-shadow(0 0 8px rgba(96,165,250,0.25))";

  svg.appendChild(grid);
  svg.appendChild(path);

  wrap.appendChild(svg);
  return wrap;
}

function demo(): number[] {
  const out: number[] = [];
  let v = 22;
  for (let i = 0; i < 50; i += 1) {
    v = Math.max(8, Math.min(40, v + (Math.random() * 6 - 3)));
    out.push(v);
  }
  return out;
}
