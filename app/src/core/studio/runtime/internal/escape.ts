/**
 * escapeHtml: minimal HTML escaping for string-based runtime output.
 * - Pure function
 * - No dependencies
 * - Keeps runtime safe by default
 */
export function escapeHtml(input: string): string {
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
