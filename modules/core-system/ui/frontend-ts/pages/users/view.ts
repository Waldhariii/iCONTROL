import type { UsersModel } from "./model";

function el<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  return node;
}

export function renderUsersView(root: HTMLElement, model: UsersModel): void {
  root.innerHTML = "";
  const wrap = el("section");
  wrap.appendChild(el("h2", model.title));

  const list = el("ul");
  model.items.forEach((item) => list.appendChild(el("li", item)));
  wrap.appendChild(list);

  root.appendChild(wrap);
}
