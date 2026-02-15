import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";
import { loadManifest } from "../../platform/runtime/loader/loader.mjs";
import { sha256, stableStringify } from "../../platform/compilers/utils.mjs";
import { getReportsDir, assertNoPlatformReportsPath, rotateReports } from "../ci/test-utils.mjs";

const ROOT = process.cwd();
const SSOT_DIR = process.env.SSOT_DIR || "./platform/ssot";
const RUNTIME_DIR = process.env.RUNTIME_DIR || "./platform/runtime";

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function appendAudit(entry) {
  const path = join(SSOT_DIR, "governance/audit_ledger.json");
  const ledger = existsSync(path) ? readJson(path) : [];
  const prev = ledger.length ? ledger[ledger.length - 1].hash : "GENESIS";
  const payload = { ...entry, prev_hash: prev };
  const hash = sha256(stableStringify(payload));
  ledger.push({ ...payload, hash });
  writeFileSync(path, JSON.stringify(ledger, null, 2) + "\n");
}

const active = readJson(join(SSOT_DIR, "changes/active_release.json"));
const manifestsDir = process.env.MANIFESTS_DIR || "./runtime/manifests";
const manifest = loadManifest({ releaseId: active.active_release_id, manifestsDir });
const policies = manifest.retention_policies || [];

const report = [];
const indexRoot = join(RUNTIME_DIR, "datagov", "records_index");
if (existsSync(indexRoot)) {
  for (const tenantDir of readdirSync(indexRoot)) {
    const tenantPath = join(indexRoot, tenantDir);
    for (const file of readdirSync(tenantPath)) {
      if (!file.endsWith(".jsonl")) continue;
      const modelId = file.replace(".jsonl", "").replace(/_/g, ":");
      const policy = policies.find((p) => p.target_model_id === modelId);
      if (!policy) continue;
      if (policy.legal_hold) {
        report.push(`SKIP ${tenantDir}/${file} legal_hold`);
        continue;
      }
      const lines = readFileSync(join(tenantPath, file), "utf-8").trim().split("\n").filter(Boolean);
      const now = Date.now();
      const kept = [];
      let purged = 0;
      for (const line of lines) {
        const rec = JSON.parse(line);
        const ageDays = (now - Date.parse(rec.created_at || now)) / (1000 * 60 * 60 * 24);
        if (ageDays > policy.retain_days) {
          purged += 1;
        } else {
          kept.push(line);
        }
      }
      writeFileSync(join(tenantPath, file), kept.join("\n") + (kept.length ? "\n" : ""), "utf-8");
      report.push(`PURGE ${tenantDir}/${file} purged=${purged}`);
      appendAudit({ event: "retention_purge", tenant_id: tenantDir, model_id: modelId, purged, at: new Date().toISOString() });
    }
  }
}

const reportDir = getReportsDir();
assertNoPlatformReportsPath(reportDir);
mkdirSync(reportDir, { recursive: true });
const outPath = join(reportDir, `RETENTION_REPORT_${Date.now()}.md`);
assertNoPlatformReportsPath(outPath);
writeFileSync(outPath, report.join("\n") + "\n");
const removed = rotateReports({ prefix: "RETENTION_REPORT_", keep: 20, dir: reportDir });
if (removed) console.log(`Retention report rotation: removed ${removed}`);
console.log(`Retention report written: ${outPath}`);
