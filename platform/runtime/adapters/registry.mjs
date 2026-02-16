/**
 * Phase AF: Adapter registry. register/get/list with allowlist.
 */
import { ALLOWLIST_KINDS } from "./types.mjs";

const registry = new Map();

/**
 * @param {string} kind - Must be in ALLOWLIST_KINDS
 * @param {import("./types.mjs").Adapter} adapter
 */
export function register(kind, adapter) {
  if (!ALLOWLIST_KINDS.includes(kind)) {
    throw new Error(`Adapter kind not allowlisted: ${kind}`);
  }
  registry.set(kind, { kind, ...adapter });
}

/**
 * @param {string} kind
 * @returns {import("./types.mjs").Adapter}
 */
export function get(kind) {
  const adapter = registry.get(kind);
  if (!adapter) throw new Error(`Adapter not registered: ${kind}`);
  return adapter;
}

/**
 * @returns {string[]}
 */
export function list() {
  return Array.from(registry.keys());
}
