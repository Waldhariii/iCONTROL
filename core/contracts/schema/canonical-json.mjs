/**
 * Canonical JSON and sha256 for deterministic hashing (e.g. manifest fingerprint).
 */
import { createHash } from "crypto";

function sortKeysDeep(value) {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === "object") {
    const keys = Object.keys(value).sort();
    const out = {};
    for (const k of keys) out[k] = sortKeysDeep(value[k]);
    return out;
  }
  return value;
}

/** Stable key sort, arrays preserved order, no extra whitespace. */
export function canonicalize(obj) {
  return JSON.stringify(sortKeysDeep(obj));
}

/** Hex sha256 of string. */
export function sha256(str) {
  return createHash("sha256").update(str).digest("hex");
}
