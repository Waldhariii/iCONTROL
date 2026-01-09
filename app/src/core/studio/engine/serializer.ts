import type { JsonValue } from "./types";
import { isJsonValue, stableStringify } from "./internal/json";

/**
 * Serializer: small, deterministic JSON serializer for core governance.
 * Throws only on invalid input (explicit contract).
 */
export function serializeJson(input: unknown): string {
  if (!isJsonValue(input)) throw new Error("serializeJson: invalid_json_value");
  return stableStringify(input as JsonValue);
}
