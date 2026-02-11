// @ts-nocheck
export function renderAccessDenied(root: HTMLElement, message = "Access denied."): void {
  root.innerHTML = `<div style="opacity:.8;max-width:780px;margin:24px auto;">${message}</div>`;
}

export function safeRender(root: HTMLElement, run: () => void): void {
  try {
    run();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    root.innerHTML = `<div style="opacity:.8;max-width:780px;margin:24px auto;">Render error: ${msg}</div>`;
  }
}
