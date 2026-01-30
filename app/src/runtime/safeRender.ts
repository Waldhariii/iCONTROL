export type RenderFn = () => string;

export function safeRender(render: RenderFn, fallback: (e: unknown) => string): string {
  try {
    return render();
  } catch (e) {
    return fallback(e);
  }
}

export function escapeHtml(s: string): string {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}
