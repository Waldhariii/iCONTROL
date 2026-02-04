import type { JsonValue } from "../types";

export function isJsonValue(x: unknown): x is JsonValue {
  // Cheap structural validation; protects from functions/symbols/bigints.
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

export function stableStringify(x: JsonValue): string {
  // Stable key order to avoid churn.
  if (x === null) return "null";
  if (typeof x !== "object") return JSON.stringify(x);
  if (Array.isArray(x)) return `[${x.map(stableStringify).join(",")}]`;
  const obj = x as Record<string, JsonValue>;
  const keys = Object.keys(obj).sort();
  const body = keys.map(k => `${JSON.stringify(k)}:${stableStringify((obj[k] ?? null) as JsonValue)}`).join(",");
  return `{${body}}`;
}
