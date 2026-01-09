import type { SafeRenderResult } from "../types";

export function blocked(detail?: string): SafeRenderResult {
  return { ok: false, reason: "render_blocked", detail };
}

export function invalid(detail?: string): SafeRenderResult {
  return { ok: false, reason: "invalid_input", detail };
}

export function internal(detail?: string): SafeRenderResult {
  return { ok: false, reason: "internal_error", detail };
}
