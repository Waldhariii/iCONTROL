import { webStorage } from "../../platform/storage/webStorage";
import { nsKey } from "../runtime/storageNs";
import { isSafeMode } from "../runtime/safeMode";
import { isEnabled } from "../../policies/feature_flags.enforce";
import { createAuditHook } from "../write-gateway/auditHook";
import { createLegacyAdapter } from "../write-gateway/adapters/legacyAdapter";
import { createPolicyHook } from "../write-gateway/policyHook";
import { createCorrelationId, createWriteGateway } from "../write-gateway/writeGateway";
import { getLogger } from "../utils/logger";
import { DEFAULT_ENTITLEMENTS, type Entitlements } from "./types";

const BASE_KEY = "entitlements.v1";
const logger = getLogger("WRITE_GATEWAY_ENTITLEMENTS_STORAGE");
let storageGateway: ReturnType<typeof createWriteGateway> | null = null;

function resolveStorageGateway() {
  if (storageGateway) return storageGateway;
  storageGateway = createWriteGateway({
    policy: createPolicyHook(),
    audit: createAuditHook(),
    adapter: createLegacyAdapter((cmd) => {
      void cmd;
      return { status: "SKIPPED", correlationId: cmd.correlationId };
    }, "entitlementsStorageShadowNoop"),
    safeMode: { enabled: true },
  });
  return storageGateway;
}

function isEntitlementsStorageShadowEnabled(): boolean {
  try {
    const rt: any = globalThis as any;
    const decisions = rt?.__FEATURE_DECISIONS__ || rt?.__featureFlags?.decisions;
    if (Array.isArray(decisions)) return isEnabled(decisions, "entitlements_storage_shadow");
    const flags = rt?.__FEATURE_FLAGS__ || rt?.__featureFlags?.flags;
    const state = flags?.entitlements_storage_shadow?.state;
    return state === "ON" || state === "ROLLOUT";
  } catch {
    return false;
  }
}

function safeParse(json: string): unknown {
  try { return JSON.parse(json); } catch { return null; }
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function coerceEntitlements(v: unknown): Entitlements {
  if (!isObject(v)) return DEFAULT_ENTITLEMENTS;

  const planValue = v["plan"];
  const plan = (planValue === "PRO" || planValue === "ENTERPRISE" || planValue === "FREE") ? planValue : "FREE";
  const modulesValue = v["modules"];
  const modules = isObject(modulesValue) ? Object.fromEntries(
    Object.entries(modulesValue).map(([k, val]) => [k, Boolean(val)])
  ) : {};
  const expiresAtMs = typeof v["expiresAtMs"] === "number" ? v["expiresAtMs"] : undefined;

  const e: Entitlements = {
    plan,
    modules,
    ...(typeof expiresAtMs === "number" ? { expiresAtMs } : {}),
  };
  // expiry governance
  if (typeof e.expiresAtMs === "number" && Date.now() > e.expiresAtMs) {
    return DEFAULT_ENTITLEMENTS;
  }
  return e;
}

export function entitlementsKey(tenantId: string): string {
  // tenantId must be stable identifier; if unknown, use "local".
  const t = (tenantId || "local").trim();
  return nsKey(`${t}.${BASE_KEY}`);
}

export function loadEntitlements(tenantId: string): Entitlements {
  const raw = webStorage.get(entitlementsKey(tenantId));
  if (!raw) return DEFAULT_ENTITLEMENTS;
  return coerceEntitlements(safeParse(raw));
}

export function saveEntitlements(tenantId: string, e: Entitlements): void {
  if (isSafeMode()) return;
  webStorage.set(entitlementsKey(tenantId), JSON.stringify(e));

  if (!isEntitlementsStorageShadowEnabled()) return;

  const correlationId = createCorrelationId("storage");
  const cmd = {
    kind: "ENTITLEMENTS_STORAGE_SET",
    tenantId,
    correlationId,
    payload: e,
    meta: { shadow: true, source: "entitlements.storage", key: entitlementsKey(tenantId) },
  };

  try {
    const res = resolveStorageGateway().execute(cmd as any);
    if (res.status !== "OK" && res.status !== "SKIPPED") {
      logger.warn("WRITE_GATEWAY_STORAGE_FALLBACK", {
        kind: cmd.kind,
        tenant_id: tenantId,
        correlation_id: correlationId,
        status: res.status,
      });
    }
  } catch (err) {
    logger.warn("WRITE_GATEWAY_STORAGE_ERROR", {
      kind: cmd.kind,
      tenant_id: tenantId,
      correlation_id: correlationId,
      error: String(err),
    });
  }
}

export function clearEntitlements(tenantId: string): void {
  if (isSafeMode()) return;
  webStorage.del(entitlementsKey(tenantId));
}
