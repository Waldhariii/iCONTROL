import type { RuntimeConfig } from "./types";

export const DEFAULT_RUNTIME_CONFIG: RuntimeConfig = {
  schemaVersion: 1,
  defaultTier: "free",
  tenants: {},
  appKindOverrides: {},
};
