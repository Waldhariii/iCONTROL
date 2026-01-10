export function escapeHtml(s: string): string {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function createSectionCard(title: string): HTMLElement {
  const section = document.createElement("section");
  section.className = "cxCard";
  section.style.cssText = "margin:10px 0;";

  const header = document.createElement("div");
  header.className = "cxTitle";
  header.style.cssText = "margin-bottom:6px;";
  header.textContent = title;

  const body = document.createElement("div");
  body.className = "cxBody";

  section.appendChild(header);
  section.appendChild(body);
  return section;
}

export function appendAction(
  host: HTMLElement,
  label: string,
  onClick: () => void,
  disabled: boolean
): void {
  const row = document.createElement("div");
  row.style.cssText = "margin-top:10px;display:flex;gap:8px;align-items:center;";
  const btn = document.createElement("button");
  btn.textContent = label;
  btn.style.cssText = "padding:6px 10px;border-radius:10px;border:1px solid #555;background:transparent;color:inherit;cursor:pointer;";
  if (disabled) {
    btn.disabled = true;
    btn.style.opacity = "0.5";
  } else {
    btn.addEventListener("click", onClick);
  }
  row.appendChild(btn);
  host.appendChild(row);
}
