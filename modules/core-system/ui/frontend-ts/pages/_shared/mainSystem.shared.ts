import { safeRender as coreSafeRender } from "/src/core/runtime/safe";

export function renderAccessDenied(root: HTMLElement, message = "Access denied."): void {
  root.innerHTML = `<div style=\"opacity:.8;max-width:780px;margin:24px auto;\">${message}</div>`;
}

export function safeRender(root: HTMLElement, run: (() => void) | string): void {
  coreSafeRender(root, run);
}
