// @ts-nocheck
/**
 * Module-local safeRender shim.
 * Purpose: avoid importing app/** from modules/** (boundary enforcement).
 * Fail-closed: returns escaped text for string input, passthrough otherwise.
 */
export function safeRender(input: unknown): string {
  const s = String(input ?? "");
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
