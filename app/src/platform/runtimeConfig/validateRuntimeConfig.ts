import type { RuntimeMode, RuntimeConfig, LoadedRuntimeConfig, SubscriptionTier } from "./types";
import { DEFAULT_RUNTIME_CONFIG } from "./defaults";

const TIERS: SubscriptionTier[] = ["free", "pro", "business", "enterprise"];

function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function validateTier(v: unknown, path: string): SubscriptionTier {
  assert(typeof v === "string" && (TIERS as string[]).includes(v), `ERR_RUNTIME_CONFIG_INVALID: ${path} must be one of ${TIERS.join(",")}`);
  return v as SubscriptionTier;
}

export function validateRuntimeConfig(
  raw: unknown,
  meta: Omit<LoadedRuntimeConfig["meta"], "schemaVersion">,
): LoadedRuntimeConfig {
  const mode: RuntimeMode = meta.mode;

  try {
    assert(isRecord(raw), "ERR_RUNTIME_CONFIG_INVALID: root must be object");
    const schemaVersion = (raw as any).schemaVersion;
    assert(Number.isInteger(schemaVersion) && schemaVersion > 0, "ERR_RUNTIME_CONFIG_INVALID: schemaVersion must be positive int");
    assert(schemaVersion === 1, `ERR_RUNTIME_CONFIG_SCHEMA_VERSION: unsupported schemaVersion=${schemaVersion}`);

    const defaultTier = validateTier((raw as any).defaultTier, "defaultTier");

    const tenants = (raw as any).tenants;
    if (tenants !== undefined) {
      assert(isRecord(tenants), "ERR_RUNTIME_CONFIG_INVALID: tenants must be object");
      for (const [tenantId, plan] of Object.entries(tenants)) {
        assert(isRecord(plan), `ERR_RUNTIME_CONFIG_INVALID: tenants.${tenantId} must be object`);
        validateTier((plan as any).tier, `tenants.${tenantId}.tier`);
        const features = (plan as any).features;
        if (features !== undefined) {
          assert(isRecord(features), `ERR_RUNTIME_CONFIG_INVALID: tenants.${tenantId}.features must be object`);
          for (const [k, b] of Object.entries(features)) {
            assert(typeof b === "boolean", `ERR_RUNTIME_CONFIG_INVALID: tenants.${tenantId}.features.${k} must be boolean`);
          }
        }
        const modules = (plan as any).modules;
        if (modules !== undefined) {
          assert(Array.isArray(modules) && modules.every(m => typeof m === "string"), `ERR_RUNTIME_CONFIG_INVALID: tenants.${tenantId}.modules must be string[]`);
        }
      }
    }

    const cfg: RuntimeConfig = {
      schemaVersion: 1,
      defaultTier,
      tenants: tenants as any,
      appKindOverrides: (raw as any).appKindOverrides as any,
    };

    return { config: cfg, meta: { ...meta, schemaVersion: 1 } };
  } catch (e: any) {
    const msg = String(e?.message || e);

    if (mode === "prod") {
      throw new Error(msg);
    }

    return {
      config: DEFAULT_RUNTIME_CONFIG,
      meta: { ...meta, schemaVersion: DEFAULT_RUNTIME_CONFIG.schemaVersion },
    };
  }
}
