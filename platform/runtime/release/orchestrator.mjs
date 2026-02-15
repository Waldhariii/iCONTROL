import { execSync } from "child_process";
import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";
import { sha256, stableStringify } from "../../compilers/utils.mjs";
import { analyzeCanary } from "./canary-analyzer.mjs";

const SSOT_DIR = process.env.SSOT_DIR || "./platform/ssot";
const ssotPath = (p) => join(SSOT_DIR, p);

function snapshot(label) {
  const id = `${label}-${Date.now()}`;
  const out = join(SSOT_DIR, "changes/snapshots", id);
  mkdirSync(out, { recursive: true });
  copyDir(SSOT_DIR, out);
  return out;
}

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const s = join(src, entry.name);
    const d = join(dest, entry.name);
    if (s.includes("/changes/snapshots")) continue;
    if (entry.isDirectory()) copyDir(s, d);
    else writeFileSync(d, readFileSync(s));
  }
}

function appendAudit(entry) {
  const path = ssotPath("governance/audit_ledger.json");
  const ledger = existsSync(path) ? JSON.parse(readFileSync(path, "utf-8")) : [];
  const prev = ledger.length ? ledger[ledger.length - 1].hash : "GENESIS";
  const payload = { ...entry, prev_hash: prev };
  const hash = sha256(stableStringify(payload));
  ledger.push({ ...payload, hash });
  writeFileSync(path, JSON.stringify(ledger, null, 2) + "\n");
}

function loadCanaryPolicy() {
  try {
    const policies = JSON.parse(readFileSync(ssotPath("sre/canary_policies.json"), "utf-8"));
    return policies[0] || null;
  } catch {
    return null;
  }
}

export function canaryAnalyze(releaseId) {
  const policy = loadCanaryPolicy();
  if (!policy) return { decision: "warn", reasons: ["missing_policy"] };
  const baseline = process.env.CANARY_BASELINE_JSON ? JSON.parse(process.env.CANARY_BASELINE_JSON) : { error_rate: 0.0, p95_latency_ms: 100 };
  const canary = process.env.CANARY_METRICS_JSON ? JSON.parse(process.env.CANARY_METRICS_JSON) : baseline;
  const result = analyzeCanary({ baseline, canary, policy });
  appendAudit({ event: "canary_analysis", release_id: releaseId, decision: result.decision, reasons: result.reasons, at: new Date().toISOString() });
  return result;
}

export function createReleaseCandidate(changesetId) {
  const releaseId = `rel-${Date.now()}`;
  const snapshotRef = snapshot(`release-${releaseId}`);
  const meta = { release_id: releaseId, from_changeset: changesetId, created_at: new Date().toISOString(), snapshot_ref: snapshotRef };
  writeFileSync(ssotPath(`changes/releases/${releaseId}.json`), JSON.stringify(meta, null, 2));
  appendAudit({ event: "release_candidate", release_id: releaseId, at: meta.created_at });
  return releaseId;
}

export function compileSignedManifest(releaseId, env) {
  execSync(`node scripts/ci/compile.mjs ${releaseId} ${env}`, { stdio: "inherit", env: process.env });
}

export function rollout(releaseId, strategy) {
  let decision = "pass";
  let reasons = [];
  if (strategy === "canary") {
    const result = canaryAnalyze(releaseId);
    decision = result.decision;
    reasons = result.reasons || [];
  }
  const rollout = { release_id: releaseId, strategy, decision, reasons, started_at: new Date().toISOString() };
  writeFileSync(`./platform/runtime/release/rollout.${releaseId}.json`, JSON.stringify(rollout, null, 2) + "\n");
  appendAudit({ event: "rollout_start", release_id: releaseId, at: rollout.started_at });
  return { decision, reasons };
}

export function activate(releaseId, scope) {
  const activation = { release_id: releaseId, scope, activated_at: new Date().toISOString() };
  writeFileSync(`./platform/runtime/release/activation.${releaseId}.json`, JSON.stringify(activation, null, 2) + "\n");
  appendAudit({ event: "activate", release_id: releaseId, at: activation.activated_at });
}

export function rollback(releaseId, reason) {
  const event = { release_id: releaseId, reason, rolled_back_at: new Date().toISOString() };
  writeFileSync(`./platform/runtime/release/rollback.${releaseId}.json`, JSON.stringify(event, null, 2) + "\n");
  appendAudit({ event: "rollback", release_id: releaseId, at: event.rolled_back_at, reason });
}

export function sloCheck(releaseId) {
  try {
    execSync(`node governance/gates/run-gates.mjs ${releaseId}`, { stdio: "ignore", env: process.env });
    execSync(`node platform/runtime/release/slo-check.mjs ${releaseId}`, { stdio: "ignore", env: process.env });
    return true;
  } catch {
    return false;
  }
}
