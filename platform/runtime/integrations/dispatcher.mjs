import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { createHmac, randomUUID } from "crypto";
import { sha256, stableStringify } from "../../compilers/utils.mjs";

const SSOT_DIR = process.env.SSOT_DIR || "./platform/ssot";
const RUNTIME_DIR = process.env.RUNTIME_DIR || "./platform/runtime";
const ssotPath = (p) => join(SSOT_DIR, p);

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

function appendAudit(entry) {
  const path = ssotPath("governance/audit_ledger.json");
  const ledger = existsSync(path) ? readJson(path) : [];
  const prev = ledger.length ? ledger[ledger.length - 1].hash : "GENESIS";
  const payload = { ...entry, prev_hash: prev };
  const hash = sha256(stableStringify(payload));
  ledger.push({ ...payload, hash });
  writeJson(path, ledger);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function resolveSecret(refId, _manifest, tenantId) {
  const refs = readJson(ssotPath("integrations/secrets_vault_refs.json"));
  const ref = refs.find((r) => r.ref_id === refId && r.tenant_id === tenantId);
  if (!ref) throw new Error("Secret ref not found");
  if (ref.provider === "local_env") {
    const val = process.env[ref.pointer];
    if (!val) throw new Error("Secret env missing");
    return val;
  }
  if (ref.provider === "file") {
    const val = readFileSync(ref.pointer, "utf-8");
    if (!val) throw new Error("Secret file empty");
    return val.trim();
  }
  throw new Error("Secret provider not supported");
}

function applyExportControls({ manifest, exportType, dataModelId, payload }) {
  const controls = manifest?.export_controls || [];
  const control = controls.find((c) => c.export_type === exportType);
  if (!control) throw new Error("Export control missing");
  const masking = control.masking_required === true;
  const catalog = manifest?.data_catalog || {};
  const fields = (catalog.data_fields || []).filter((f) => f.data_model_id === dataModelId);
  const classifications = new Map(fields.map((f) => [f.field_id, f.classification_id]));
  const maskedPayload = { ...payload };
  let maskedCount = 0;
  if (masking) {
    for (const [key, val] of Object.entries(payload || {})) {
      const cls = classifications.get(key) || "internal";
      if (cls === "pii.high") {
        maskedPayload[key] = "****";
        maskedCount += 1;
      } else {
        maskedPayload[key] = val;
      }
    }
  }
  return { payload: maskedPayload, maskedCount };
}

function dlqPath(tenantId, id) {
  const safe = tenantId.replace(/[^a-z0-9-_]/gi, "_");
  return join(RUNTIME_DIR, "integrations", "dlq", safe, `${id}.json`);
}

function writeDlq(entry) {
  const id = `dlq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const path = dlqPath(entry.tenant_id, id);
  writeJson(path, { id, ...entry });
  return path;
}

export async function sendWebhook({ manifest, tenantId, webhook, event, payload, qosEnforcer }) {
  const exportType = webhook.export_type || "webhook";
  const dataModelId = webhook.data_model_id || "";
  const { payload: maskedPayload, maskedCount } = applyExportControls({ manifest, exportType, dataModelId, payload });
  const body = JSON.stringify({ event, payload: maskedPayload, tenant_id: tenantId });
  const headers = { "content-type": "application/json" };
  if (webhook.secret_ref_id) {
    const secret = resolveSecret(webhook.secret_ref_id, manifest, tenantId);
    const timestamp = Date.now().toString();
    const reqId = randomUUID();
    const canonical = `${timestamp}.${body}`;
    const sig = createHmac("sha256", secret).update(canonical).digest("base64");
    headers["x-timestamp"] = timestamp;
    headers["x-request-id"] = reqId;
    headers[webhook.signature_header || "x-signature"] = sig;
  }

  const retry = webhook.retry_policy || { max_attempts: 3, base_delay_ms: 200, max_delay_ms: 2000 };
  let attempt = 0;
  while (attempt < retry.max_attempts) {
    attempt += 1;
    let qosTicket = null;
    let startedAt = Date.now();
    try {
      qosTicket = qosEnforcer ? qosEnforcer({ tenantId, actionType: "integration.webhook.out", workload: "egress", costHint: 2 }) : null;
      startedAt = Date.now();
      appendAudit({ event: "webhook_out_attempt", tenant_id: tenantId, webhook_id: webhook.webhook_id, attempt, at: new Date().toISOString() });
      const resp = await fetch(webhook.target_url, { method: "POST", headers, body });
      if (qosTicket?.finish) qosTicket.finish(resp.status, Date.now() - startedAt);
      if (resp.ok) {
        appendAudit({ event: "webhook_out_success", tenant_id: tenantId, webhook_id: webhook.webhook_id, masked_fields: maskedCount, at: new Date().toISOString() });
        return { ok: true, maskedCount };
      }
      appendAudit({ event: "webhook_out_fail", tenant_id: tenantId, webhook_id: webhook.webhook_id, status: resp.status, at: new Date().toISOString() });
    } catch (err) {
      if (qosTicket?.finish) qosTicket.finish(500, Date.now() - startedAt);
      appendAudit({ event: "webhook_out_error", tenant_id: tenantId, webhook_id: webhook.webhook_id, error: err.message, at: new Date().toISOString() });
    }
    const backoff = Math.min(retry.max_delay_ms || 2000, (retry.base_delay_ms || 200) * Math.pow(2, attempt - 1));
    await sleep(backoff);
  }

  const dlqEntry = {
    tenant_id: tenantId,
    webhook_id: webhook.webhook_id,
    event,
    payload: maskedPayload,
    masked_fields: maskedCount,
    reason: "max_attempts_exceeded",
    at: new Date().toISOString()
  };
  if (webhook.dlq_enabled) {
    const dlqFile = writeDlq(dlqEntry);
    appendAudit({ event: "webhook_out_dlq", tenant_id: tenantId, webhook_id: webhook.webhook_id, dlq_path: dlqFile, at: new Date().toISOString() });
    return { ok: false, dlq: dlqFile };
  }
  appendAudit({ event: "webhook_out_drop", tenant_id: tenantId, webhook_id: webhook.webhook_id, at: new Date().toISOString() });
  return { ok: false };
}
