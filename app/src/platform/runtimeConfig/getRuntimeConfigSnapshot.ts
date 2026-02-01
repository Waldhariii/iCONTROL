import type { LoadedRuntimeConfig, RuntimeConfig } from "./types";
import { DEFAULT_RUNTIME_CONFIG } from "./defaults";
import { validateRuntimeConfig } from "./validateRuntimeConfig";

/**
 * Browser-safe snapshot source:
 * - injected global (preferred): globalThis.__ICONTROL_RUNTIME_CONFIG__
 * - optional: could be extended later to fetch from gateway
 *
 * This module MUST remain free of Node core imports.
 */
declare global {
  // eslint-disable-next-line no-var
  var __ICONTROL_RUNTIME_CONFIG__: unknown | undefined;
}

export function getRuntimeConfigSnapshot(): LoadedRuntimeConfig {
  const loadedAt = new Date().toISOString();

  const metaBase = {
    source: "default" as const,
    filePath: undefined as string | undefined,
    sha256: undefined as string | undefined,
    loadedAt,
    mode: "dev" as const, // browser-side; prod fail-closed happens server-side
  };

  const injected = (globalThis as any).__ICONTROL_RUNTIME_CONFIG__;

  if (typeof injected === "undefined") {
    // default snapshot (browser-safe)
    return {
      config: DEFAULT_RUNTIME_CONFIG,
      meta: { ...metaBase, schemaVersion: DEFAULT_RUNTIME_CONFIG.schemaVersion },
    };
  }

  // Validate (non-destructive). In browser we do not hard-fail prod here.
  return validateRuntimeConfig(injected, { ...metaBase, source: "runtime" as const });
}

/**
 * Convenience accessor (future: swap with entitlements resolver).
 */
export function getDefaultTier(): RuntimeConfig["defaultTier"] {
  return getRuntimeConfigSnapshot().config.defaultTier;
}
