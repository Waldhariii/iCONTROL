import type { JsonValue } from "./types";

export function isNonEmptyString(x: unknown): x is string {
  return typeof x === "string" && x.trim().length > 0;
}

export function isJsonValue(x: unknown): x is JsonValue {
  if (x === null) return true;
  const t = typeof x;
  if (t === "string" || t === "number" || t === "boolean") return true;
  if (Array.isArray(x)) return x.every(isJsonValue);
  if (t === "object") {
    for (const v of Object.values(x as Record<string, unknown>)) {
      if (!isJsonValue(v)) return false;
    }
    return true;
  }
  return false;
}
