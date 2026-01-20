import { chartColor } from "./chartTokens";

export function createMiniBars(opts: { values: number[]; height?: number }): HTMLElement {
  const h = opts.height ?? 90;
  const values = opts.values.length ? opts.values.slice(0, 24) : [3, 5, 7, 2, 9, 6, 4, 8, 5, 7, 3, 6, 4, 8, 2, 7];
  const max = Math.max(...values, 1);

  const wrap = document.createElement("div");
  wrap.style.cssText = `display:flex; align-items:flex-end; gap:6px; height:${h}px; padding:10px; border-radius:10px; border:1px solid rgba(255,255,255,0.10); background:rgba(255,255,255,0.03); overflow:hidden;`;

  values.forEach((v, i) => {
    const bar = document.createElement("div");
    const bh = Math.round((v / max) * (h - 12));
    bar.style.cssText = `width: 8px; height:${bh}px; border-radius:6px; background:${i % 5 === 0 ? chartColor("teal") : "rgba(96,165,250,0.35)"};`;
    wrap.appendChild(bar);
  });

  return wrap;
}
