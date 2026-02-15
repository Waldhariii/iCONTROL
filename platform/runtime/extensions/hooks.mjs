import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { sha256, stableStringify } from "../../compilers/utils.mjs";

const SSOT_DIR = process.env.SSOT_DIR || "./platform/ssot";
const ssotPath = (p) => join(SSOT_DIR, p);

const ALLOWED_EVENTS = [
  "on_document_ingested",
  "on_workflow_completed",
  "on_budget_threshold",
  "on_qos_incident"
];

const ALLOWED_HANDLERS = [
  "enqueue_workflow",
  "write_dead_letter",
  "emit_webhook"
];

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function writeJson(path, data) {
  mkdirSync(join(path, ".."), { recursive: true });
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

export function authorizeExtensionOrDeny({ manifest, extensionId, tenantId, capability }) {
  const installs = manifest.extensions_runtime || [];
  const ext = installs.find((i) => i.extension_id === extensionId && i.tenant_id === tenantId);
  if (!ext) throw new Error("Extension not installed");
  if (!(ext.requested_capabilities || []).includes(capability)) throw new Error("Capability not allowed");
  return true;
}

export function emitEvent({ manifest, tenantId, event, payload }) {
  if (!ALLOWED_EVENTS.includes(event)) return;
  const installs = (manifest.extensions_runtime || []).filter((i) => i.tenant_id === tenantId);
  for (const ext of installs) {
    for (const h of ext.hooks || []) {
      if (h.event !== event) continue;
      if (!ALLOWED_HANDLERS.includes(h.handler)) continue;
      appendAudit({
        event: "extension_hook",
        extension_id: ext.extension_id,
        tenant_id: tenantId,
        hook: h.handler,
        at: new Date().toISOString()
      });
    }
  }
}
