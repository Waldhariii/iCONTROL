import { nsKey } from "../runtime/storageNs";
import { isSafeMode } from "../runtime/safeMode";
import { isEnabled } from "../../policies/feature_flags.enforce";
import { createAuditHook } from "../write-gateway/auditHook";
import { createLegacyAdapter } from "../write-gateway/adapters/legacyAdapter";
import { createPolicyHook } from "../write-gateway/policyHook";
import { createCorrelationId, createWriteGateway } from "../write-gateway/writeGateway";
import { getLogger } from "../utils/logger";
import { getTenantId } from "../runtime/tenant";

export type AuditLevel = "INFO" | "WARN" | "ERR";

export type AuditEvent = {
  ts: string;               // ISO
  level: AuditLevel;
  code: string;             // WARN_* / ERR_*
  scope?: string;           // ex: "entitlements"
  message?: string;
  meta?: Record<string, any>;
};

const BASE_KEY = "auditLog.v1";
const MAX = 500;
const logger = getLogger("WRITE_GATEWAY_AUDIT");
let auditGateway: ReturnType<typeof createWriteGateway> | null = null;

function resolveAuditGateway() {
  if (auditGateway) return auditGateway;
  auditGateway = createWriteGateway({
    policy: createPolicyHook(),
    audit: createAuditHook(),
    adapter: createLegacyAdapter((cmd) => {
      void cmd;
      return { status: "SKIPPED", correlationId: cmd.correlationId };
    }, "auditShadowNoop"),
    safeMode: { enabled: true },
  });
  return auditGateway;
}

function isAuditShadowEnabled(): boolean {
  try {
    const rt: any = globalThis as any;
    const decisions = rt?.__FEATURE_DECISIONS__ || rt?.__featureFlags?.decisions;
    if (Array.isArray(decisions)) return isEnabled(decisions, "audit_shadow");
    const flags = rt?.__FEATURE_FLAGS__ || rt?.__featureFlags?.flags;
    const state = flags?.audit_shadow?.state;
    return state === "ON" || state === "ROLLOUT";
  } catch {
    return false;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function key(): string {
  return nsKey(BASE_KEY);
}

export function readAuditLog(): AuditEvent[] {
  try {
    const raw = localStorage.getItem(key());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeAuditLog(events: AuditEvent[]) {
  if (isSafeMode()) return; // governance: read-only
  const trimmed = events.slice(-MAX);
  localStorage.setItem(key(), JSON.stringify(trimmed));
}

export function appendAuditEvent(ev: Omit<AuditEvent, "ts"> & { ts?: string }) {
  if (isSafeMode()) return; // governance: read-only
  const events = readAuditLog();
  const entry: AuditEvent = { ts: ev.ts ?? nowIso(), ...ev };
  events.push(entry);
  writeAuditLog(events);

  if (!isAuditShadowEnabled()) return;

  const correlationId = createCorrelationId("audit");
  const tenantId = getTenantId();
  const storageKey = key();
  const cmd = {
    kind: "AUDIT_APPEND",
    tenantId,
    correlationId,
    payload: entry,
    meta: { shadow: true, source: "auditLog", storageKey, ts: entry.ts },
  };

  try {
    const res = resolveAuditGateway().execute(cmd as any);
    if (res.status !== "OK" && res.status !== "SKIPPED") {
      logger.warn("WRITE_GATEWAY_AUDIT_FALLBACK", {
        kind: cmd.kind,
        tenant_id: tenantId,
        correlation_id: correlationId,
        status: res.status,
      });
    }
  } catch (err) {
    logger.warn("WRITE_GATEWAY_AUDIT_ERROR", {
      kind: cmd.kind,
      tenant_id: tenantId,
      correlation_id: correlationId,
      error: String(err),
    });
  }
}

export function exportAuditLogJson(): string {
  return JSON.stringify(readAuditLog(), null, 2);
}

export function clearAuditLog() {
  if (isSafeMode()) return; // governance: read-only
  localStorage.removeItem(key());
}
