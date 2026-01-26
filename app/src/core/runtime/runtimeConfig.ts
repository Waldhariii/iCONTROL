import { isEnabled } from "../../policies/feature_flags.enforce";
import { createAuditHook } from "../write-gateway/auditHook";
import { createLegacyAdapter } from "../write-gateway/adapters/legacyAdapter";
import { createPolicyHook } from "../write-gateway/policyHook";
import { createCorrelationId, createWriteGateway } from "../write-gateway/writeGateway";
import { getLogger } from "../utils/logger";
import { getTenantId } from "./tenant";

export type RuntimeConfig = {
  tenant_id: string;
  app_base_path: string;
  cp_base_path: string;
  api_base_url: string;
  assets_base_url: string;
  version: number;
};

const LS_KEY = "icontrol.runtime.config.v1";
let cached: RuntimeConfig | null = null;
const logger = getLogger("WRITE_GATEWAY_RUNTIME_CONFIG");
let runtimeCfgGateway: ReturnType<typeof createWriteGateway> | null = null;

function resolveRuntimeCfgGateway() {
  if (runtimeCfgGateway) return runtimeCfgGateway;
  runtimeCfgGateway = createWriteGateway({
    policy: createPolicyHook(),
    audit: createAuditHook(),
    adapter: createLegacyAdapter((cmd) => {
      void cmd;
      return { status: "SKIPPED", correlationId: cmd.correlationId };
    }, "runtimeConfigShadowNoop"),
    safeMode: { enabled: true },
  });
  return runtimeCfgGateway;
}

function isRuntimeConfigShadowEnabled(): boolean {
  try {
    const rt: any = globalThis as any;
    const decisions = rt?.__FEATURE_DECISIONS__ || rt?.__featureFlags?.decisions;
    if (Array.isArray(decisions)) return isEnabled(decisions, "runtime_config_shadow");
    const flags = rt?.__FEATURE_FLAGS__ || rt?.__featureFlags?.flags;
    const state = flags?.runtime_config_shadow?.state;
    return state === "ON" || state === "ROLLOUT";
  } catch {
    return false;
  }
}

function resolveScope(): "/app" | "/cp" {
  try {
    const p = typeof window !== "undefined" ? window.location.pathname : "";
    if (p.startsWith("/cp")) return "/cp";
  } catch {}
  return "/app";
}

function fallbackConfig(): RuntimeConfig {
  return {
    tenant_id: "local",
    app_base_path: "/app",
    cp_base_path: "/cp",
    api_base_url: "/api",
    assets_base_url: "/assets",
    version: 1,
  };
}

function readCached(): RuntimeConfig | null {
  if (cached) return cached;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    cached = JSON.parse(raw) as RuntimeConfig;
    return cached;
  } catch {
    return null;
  }
}

function writeCachedLegacy(next: RuntimeConfig) {
  cached = next;
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  } catch {}
}

function writeCached(next: RuntimeConfig) {
  writeCachedLegacy(next);
  if (!isRuntimeConfigShadowEnabled()) return;

  const tenantId = getTenantId();
  const correlationId = createCorrelationId("runtimecfg");
  const serialized = JSON.stringify(next);
  const cmd = {
    kind: "RUNTIME_CONFIG_SET",
    tenantId,
    correlationId,
    payload: { key: LS_KEY, bytes: serialized.length },
    meta: { shadow: true, source: "runtimeConfig.ts" },
  };

  try {
    const res = resolveRuntimeCfgGateway().execute(cmd as any);
    if (res.status !== "OK" && res.status !== "SKIPPED") {
      logger.warn("WRITE_GATEWAY_RUNTIME_CONFIG_FALLBACK", {
        kind: cmd.kind,
        tenant_id: tenantId,
        correlation_id: correlationId,
        status: res.status,
      });
    }
  } catch (err) {
    logger.warn("WRITE_GATEWAY_RUNTIME_CONFIG_ERROR", {
      kind: cmd.kind,
      tenant_id: tenantId,
      correlation_id: correlationId,
      error: String(err),
    });
  }
}

export async function resolveRuntimeConfig(): Promise<RuntimeConfig> {
  const existing = readCached();
  if (existing) return existing;

  const scope = resolveScope();
  try {
    const res = await fetch(`${scope}/api/runtime-config`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error(`ERR_RUNTIME_CONFIG_${res.status}`);
    const json = (await res.json()) as RuntimeConfig;
    writeCached(json);
    return json;
  } catch {
    const fallback = fallbackConfig();
    writeCached(fallback);
    return fallback;
  }
}

export async function resolveApiBaseUrl(): Promise<string> {
  const cfg = await resolveRuntimeConfig();
  return cfg.api_base_url;
}
