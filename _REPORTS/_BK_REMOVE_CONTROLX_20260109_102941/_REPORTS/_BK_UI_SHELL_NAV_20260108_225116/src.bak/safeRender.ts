export function safeRender(fn: () => void, onError: (e: unknown) => void): void {
  try { fn(); } catch (e) { onError(e); }
}
