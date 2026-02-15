import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { applyOpsToDir } from "../../platform/runtime/changes/patch-engine.mjs";
import { sha256, stableStringify } from "../../platform/compilers/utils.mjs";
import { getReportsDir, assertNoPlatformReportsPath, rotateReports } from "../ci/test-utils.mjs";

const SSOT_DIR = process.env.SSOT_DIR || "./platform/ssot";
const RUNTIME_DIR = process.env.RUNTIME_DIR || join(SSOT_DIR, "..", "runtime");
const MANIFESTS_DIR = process.env.MANIFESTS_DIR || join(RUNTIME_DIR, "manifests");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function writeJson(path, data) {
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

function copyDir(src, dest, skipAudit = false) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const s = join(src, entry);
    const d = join(dest, entry);
    if (s.includes("/changes/snapshots")) continue;
    if (s.includes("/changes/changesets")) continue;
    if (s.includes("/changes/releases")) continue;
    if (skipAudit && s.endsWith("/governance/audit_ledger.json")) continue;
    const st = statSync(s);
    if (st.isDirectory()) copyDir(s, d, skipAudit);
    else writeFileSync(d, readFileSync(s));
  }
}

function appendAudit(entry) {
  const path = join(SSOT_DIR, "governance", "audit_ledger.json");
  const ledger = existsSync(path) ? readJson(path) : [];
  const prev = ledger.length ? ledger[ledger.length - 1].hash : "GENESIS";
  const payload = { ...entry, prev_hash: prev };
  const hash = sha256(stableStringify(payload));
  ledger.push({ ...payload, hash });
  writeJson(path, ledger);
}

function verifyAuditChain() {
  const path = join(SSOT_DIR, "governance", "audit_ledger.json");
  const ledger = existsSync(path) ? readJson(path) : [];
  let prev = "GENESIS";
  for (const entry of ledger) {
    const { hash, ...rest } = entry;
    const expected = sha256(stableStringify({ ...rest, prev_hash: prev }));
    if (expected !== hash) return false;
    prev = hash;
  }
  return true;
}

const ts = new Date().toISOString().replace(/[:.]/g, "-");
const reportDir = getReportsDir();
assertNoPlatformReportsPath(reportDir);
mkdirSync(reportDir, { recursive: true });
const reportPath = join(reportDir, `RESTORE_DRILL_${ts}.md`);
assertNoPlatformReportsPath(reportPath);

const activePath = join(SSOT_DIR, "changes", "active_release.json");
const activeBefore = existsSync(activePath) ? readJson(activePath) : { active_release_id: "" };

appendAudit({ event: "drill_start", at: new Date().toISOString() });
const snapshotId = `drill-${Date.now()}`;
const snapshotDir = join(SSOT_DIR, "changes", "snapshots", snapshotId);
copyDir(SSOT_DIR, snapshotDir, false);

const pagesPath = join(SSOT_DIR, "studio", "pages", "page_definitions.json");
const pages = readJson(pagesPath);
if (!pages.length) throw new Error("No pages available for drill");
const target = pages[0];
const op = { op: "update", target: { kind: "page_definition", ref: target.id }, value: { ...target, title_key: `${target.title_key}.drill` }, preconditions: { expected_exists: true } };
applyOpsToDir(SSOT_DIR, [op]);
appendAudit({ event: "drill_change_applied", target: target.id, at: new Date().toISOString() });

const releaseId = `drill-${Date.now()}`;
execSync(`node scripts/ci/compile.mjs ${releaseId} dev`, { stdio: "inherit", env: { ...process.env, SSOT_DIR, OUT_DIR: MANIFESTS_DIR } });
execSync(`node governance/gates/run-gates.mjs ${releaseId}`, { stdio: "inherit", env: { ...process.env, SSOT_DIR, MANIFESTS_DIR } });

copyDir(snapshotDir, SSOT_DIR, true);
appendAudit({ event: "drill_restore", snapshot: snapshotId, at: new Date().toISOString() });

const activeAfter = existsSync(activePath) ? readJson(activePath) : { active_release_id: "" };
const auditOk = verifyAuditChain();

const restoreReleaseId = `drill-restore-${Date.now()}`;
execSync(`node scripts/ci/compile.mjs ${restoreReleaseId} dev`, { stdio: "inherit", env: { ...process.env, SSOT_DIR, OUT_DIR: MANIFESTS_DIR } });
execSync(`node governance/gates/run-gates.mjs ${restoreReleaseId}`, { stdio: "inherit", env: { ...process.env, SSOT_DIR, MANIFESTS_DIR } });

const lines = [
  `# Restore Drill ${ts}`,
  `Snapshot: ${snapshotId}`,
  `Active release stable: ${activeBefore.active_release_id === activeAfter.active_release_id}`,
  `Audit chain ok: ${auditOk}`
];
writeFileSync(reportPath, lines.join("\n") + "\n", "utf-8");
appendAudit({ event: "drill_success", at: new Date().toISOString(), report: reportPath });

const removed = rotateReports({ prefix: "RESTORE_DRILL_", keep: 10, dir: reportDir });
if (removed) console.log(`Restore drill rotation: removed ${removed}`);
console.log(`Restore drill report: ${reportPath}`);
