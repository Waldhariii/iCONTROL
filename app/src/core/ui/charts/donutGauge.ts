import { chartColor } from "./chartTokens";

export function createDonutGauge(opts: {
  valuePct: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
}): HTMLElement {
  const size = opts.size ?? 170;
  const stroke = opts.stroke ?? 14;
  const pct = Math.max(0, Math.min(100, opts.valuePct));

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;

  const wrap = document.createElement("div");
  wrap.style.cssText = `display:flex; align-items:center; justify-content:center; position:relative; width:${size}px; height:${size}px;`;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("viewBox", `0 0 ${size} ${size}`);

  const bg = document.createElementNS(svg.namespaceURI, "circle");
  bg.setAttribute("cx", String(size / 2));
  bg.setAttribute("cy", String(size / 2));
  bg.setAttribute("r", String(r));
  bg.setAttribute("fill", "none");
  bg.setAttribute("stroke", "rgba(255,255,255,0.08)");
  bg.setAttribute("stroke-width", String(stroke));

  const fg = document.createElementNS(svg.namespaceURI, "circle");
  fg.setAttribute("cx", String(size / 2));
  fg.setAttribute("cy", String(size / 2));
  fg.setAttribute("r", String(r));
  fg.setAttribute("fill", "none");
  fg.setAttribute("stroke", chartColor("teal"));
  fg.setAttribute("stroke-width", String(stroke));
  fg.setAttribute("stroke-linecap", "round");
  fg.setAttribute("stroke-dasharray", `${dash} ${c - dash}`);
  fg.setAttribute("transform", `rotate(-90 ${size / 2} ${size / 2})`);
  (fg as any).style.filter = "drop-shadow(0 0 10px rgba(53,194,184,0.25))";

  const accentDash = Math.max(0, Math.min(c, (Math.min(18, 100 - pct) / 100) * c));
  const acc = document.createElementNS(svg.namespaceURI, "circle");
  acc.setAttribute("cx", String(size / 2));
  acc.setAttribute("cy", String(size / 2));
  acc.setAttribute("r", String(r));
  acc.setAttribute("fill", "none");
  acc.setAttribute("stroke", chartColor("purple"));
  acc.setAttribute("stroke-width", String(stroke));
  acc.setAttribute("stroke-linecap", "round");
  acc.setAttribute("stroke-dasharray", `${accentDash} ${c - accentDash}`);
  acc.setAttribute("transform", `rotate(${(-90 + (pct / 100) * 360)} ${size / 2} ${size / 2})`);
  (acc as any).style.opacity = "0.85";
  (acc as any).style.filter = "drop-shadow(0 0 10px rgba(139,92,246,0.22))";

  svg.appendChild(bg);
  svg.appendChild(fg);
  svg.appendChild(acc);

  const center = document.createElement("div");
  center.style.cssText = "position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px;";

  const big = document.createElement("div");
  big.textContent = `${Math.round(pct)}%`;
  big.style.cssText = "font-size:40px; font-weight:800; color: var(--ic-text, #e7ecef); letter-spacing:-0.5px;";

  const small = document.createElement("div");
  small.textContent = opts.sublabel ?? "0%";
  small.style.cssText = "font-size:12px; color: var(--ic-mutedText, #a7b0b7);";

  center.appendChild(big);
  center.appendChild(small);

  wrap.appendChild(svg);
  wrap.appendChild(center);
  return wrap;
}
