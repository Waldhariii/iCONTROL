import type { SafeRenderResult } from "./types";
import { isString } from "./internal/strings";
import { isHtmlSafe } from "./internal/html-guards";
import { blocked, invalid, internal } from "./internal/errors";

/**
 * Safe Render: governance layer for rendering user-provided HTML-ish content.
 * Returns a discriminated union result; never throws.
 */
export function safeRender(input: unknown): SafeRenderResult {
  try {
    if (!isString(input) || input.trim().length === 0) return invalid("expected_non_empty_string");
    const verdict = isHtmlSafe(input);
    if (!verdict.ok) return blocked(verdict.detail);
    return { ok: true, html: input };
  } catch (e) {
    return internal(e instanceof Error ? e.message : "unknown");
  }
}
