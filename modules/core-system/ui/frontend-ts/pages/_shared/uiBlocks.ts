export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string>,
  text?: string
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (attrs) Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  if (text !== undefined) node.textContent = text;
  return node;
}

export function sectionCard(title: string): HTMLDivElement {
  const card = el("div");
  card.style.cssText = [
    "margin:14px 0",
    "padding:14px",
    "border-radius:16px",
    "border:1px solid var(--line)",
    "background:rgba(255,255,255,0.03)"
  ].join(";");

  const h = el("div", undefined, title);
  h.style.cssText = "font-weight:800;margin-bottom:10px";
  card.appendChild(h);
  return card;
}

export function appendParagraph(host: HTMLElement, text: string): void {
  const p = el("div", undefined, text);
  p.style.cssText = "opacity:.8;line-height:1.4";
  host.appendChild(p);
}

export function appendList(host: HTMLElement, items: string[]): void {
  const ul = el("ul");
  ul.style.cssText = "margin:0;padding-left:18px;opacity:.9";
  items.forEach((item) => ul.appendChild(el("li", undefined, item)));
  host.appendChild(ul);
}

export function appendKeyValueTable(host: HTMLElement, rows: Array<{ key: string; value: string }>): void {
  const table = el("table");
  table.style.cssText = "width:100%;border-collapse:collapse";

  rows.forEach((r) => {
    const tr = el("tr");
    const tdKey = el("td", undefined, r.key);
    tdKey.style.cssText = "padding:8px;border-bottom:1px solid var(--line);opacity:.85;width:40%";
    const tdVal = el("td", undefined, r.value);
    tdVal.style.cssText = "padding:8px;border-bottom:1px solid var(--line)";
    tr.appendChild(tdKey);
    tr.appendChild(tdVal);
    table.appendChild(tr);
  });

  host.appendChild(table);
}

export function appendTable(
  host: HTMLElement,
  columns: string[],
  rows: Array<Record<string, string>>
): void {
  const table = el("table");
  table.style.cssText = "width:100%;border-collapse:collapse";

  const thead = el("thead");
  const trh = el("tr");
  columns.forEach((c) => {
    const th = el("th", undefined, c);
    th.style.cssText = "text-align:left;padding:8px;border-bottom:1px solid var(--line);font-size:12px;opacity:.85";
    trh.appendChild(th);
  });
  thead.appendChild(trh);
  table.appendChild(thead);

  const tbody = el("tbody");
  rows.forEach((row) => {
    const tr = el("tr");
    columns.forEach((c) => {
      const td = el("td", undefined, row[c] ?? "");
      td.style.cssText = "padding:8px;border-bottom:1px solid var(--line)";
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);

  host.appendChild(table);
}

export function appendPillRow(host: HTMLElement, items: string[]): void {
  const wrap = el("div");
  wrap.style.cssText = "display:flex;flex-wrap:wrap;gap:8px";
  items.forEach((item) => {
    const pill = el("span", undefined, item);
    pill.style.cssText = [
      "padding:4px 10px",
      "border-radius:999px",
      "border:1px solid var(--line)",
      "background:rgba(255,255,255,0.04)",
      "font-size:12px"
    ].join(";");
    wrap.appendChild(pill);
  });
  host.appendChild(wrap);
}
