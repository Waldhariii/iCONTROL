import { execSync } from "child_process";
import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";
import { sha256, stableStringify } from "../../compilers/utils.mjs";

function snapshot(label) {
  const id = `${label}-${Date.now()}`;
  const out = join("./platform/ssot/changes/snapshots", id);
  mkdirSync(out, { recursive: true });
  copyDir("./platform/ssot", out);
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
  const path = "./platform/ssot/governance/audit_ledger.json";
  const ledger = existsSync(path) ? JSON.parse(readFileSync(path, "utf-8")) : [];
  const prev = ledger.length ? ledger[ledger.length - 1].hash : "GENESIS";
  const payload = { ...entry, prev_hash: prev };
  const hash = sha256(stableStringify(payload));
  ledger.push({ ...payload, hash });
  writeFileSync(path, JSON.stringify(ledger, null, 2) + "\n");
}

export function createReleaseCandidate(changesetId) {
  const releaseId = `rel-${Date.now()}`;
  const snapshotRef = snapshot(`release-${releaseId}`);
  const meta = { release_id: releaseId, from_changeset: changesetId, created_at: new Date().toISOString(), snapshot_ref: snapshotRef };
  writeFileSync(`./platform/ssot/changes/releases/${releaseId}.json`, JSON.stringify(meta, null, 2));
  appendAudit({ event: "release_candidate", release_id: releaseId, at: meta.created_at });
  return releaseId;
}

export function compileSignedManifest(releaseId, env) {
  execSync(`node scripts/ci/compile.mjs ${releaseId} ${env}`, { stdio: "inherit" });
}

export function rollout(releaseId, strategy) {
  const rollout = { release_id: releaseId, strategy, started_at: new Date().toISOString() };
  writeFileSync(`./platform/runtime/release/rollout.${releaseId}.json`, JSON.stringify(rollout, null, 2) + "\n");
  appendAudit({ event: "rollout_start", release_id: releaseId, at: rollout.started_at });
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
