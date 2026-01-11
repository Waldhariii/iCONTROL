/**
 * Lightweight validator (no jsonschema library):
 * - Validates only high-signal invariants to keep blast-radius minimal.
 * - Full schema validation can be added later behind a feature flag.
 */

import type { BlueprintKind } from "./types";

type Obj = Record<string, unknown>;

function isObj(v: unknown): v is Obj {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export type ValidateResult =
  | { ok: true }
  | { ok: false; reason: "invalid_shape" | "missing_field"; detail: string };

export function validateBlueprint(kind: BlueprintKind, doc: unknown): ValidateResult {
  if (!isObj(doc)) return { ok: false, reason: "invalid_shape", detail: "doc must be an object" };

  // Common expected fields (from your JSON patterns)
  // We keep this permissive: the point is to catch gross corruption, not enforce everything.
  if (!("meta" in doc) || !isObj(doc.meta)) {
    return { ok: false, reason: "missing_field", detail: "meta object missing" };
  }

  const meta = doc.meta as Obj;

  if (!("kind" in meta) || typeof meta.kind !== "string") {
    return { ok: false, reason: "missing_field", detail: "meta.kind missing" };
  }
  if (meta.kind !== kind) {
    return { ok: false, reason: "invalid_shape", detail: `meta.kind=${String(meta.kind)} expected=${kind}` };
  }

  if (!("version" in meta) || typeof meta.version !== "number") {
    return { ok: false, reason: "missing_field", detail: "meta.version missing/invalid" };
  }

  // data is expected but can be any shape
  if (!("data" in doc)) {
    return { ok: false, reason: "missing_field", detail: "data missing" };
  }

  return { ok: true };
}

// --- iCONTROL stable export alias (compat) ---
// Goal: runtime expects validateBlueprintDoc; keep surface stable and decouple internal naming.
export function validateBlueprintDoc(...args: any[]): any {
  // Prefer existing exported validator if present; fallback to validateDoc symbol if available.
  try {
    return (validateBlueprint as any)(...args);
  } catch (e) {
    // Defensive: never throw across package boundary
    return { ok: false, reason: "internal_error", detail: e instanceof Error ? e.message : "unknown" };
  }
}
