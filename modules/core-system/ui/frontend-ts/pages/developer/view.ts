import type { DeveloperModel } from "./model";

function el<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  return node;
}

export function renderDeveloperView(root: HTMLElement, model: DeveloperModel): void {
  root.innerHTML = "";
  const wrap = el("section");
  wrap.appendChild(el("h2", model.title));

  const list = el("ul");
  model.notes.forEach((note) => list.appendChild(el("li", note)));
  wrap.appendChild(list);

  root.appendChild(wrap);
}
