import type { AccountModel } from "./model";

function el<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  return node;
}

export function renderAccountView(root: HTMLElement, model: AccountModel): void {
  root.innerHTML = "";
  const wrap = el("section");
  wrap.appendChild(el("h2", model.title));
  wrap.appendChild(el("p", model.description));
  root.appendChild(wrap);
}
