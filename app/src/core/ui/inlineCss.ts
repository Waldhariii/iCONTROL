/**
 * ICONTROL_UI_INLINE_CSS_V1
 * SSOT helper to apply/append inline cssText outside CP pages, so CP contract stays clean.
 * NOTE: This is a transitional bridge. Long-term goal is pure SSOT classes + tokens.
 */
export function setCss(el: HTMLElement, cssText: string): void {
  el.style.cssText = cssText;
}

export function appendCss(el: HTMLElement, cssText: string): void {
  // Append safely
  const cur = el.style.cssText || "";
  const sep = cur && !cur.trim().endsWith(";") ? ";" : "";
  el.style.cssText = cur + sep + cssText;
}
