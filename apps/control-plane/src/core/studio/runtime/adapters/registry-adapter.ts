import type { RegistryLike } from "../execute";

// Import is type-only to keep runtime decoupled at runtime (no hard dependency side effects).
import type { ComponentRegistry } from "../../registry";

/**
 * Adapter layer: bridges core registry -> runtime RegistryLike contract.
 * - Keeps coupling contained to this file.
 * - Runtime stays framework-agnostic (string pipeline).
 */
export function asRegistryLike(registry: ComponentRegistry): RegistryLike {
  return {
    resolve(id: string) {
      // ComponentRegistry API: get(id) returns the entry or undefined.
      // We expose only the component function (if present).
      const entry = (registry as any).get?.(id);
      return entry?.component;
    },
  };
}
