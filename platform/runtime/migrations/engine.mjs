import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { parseSemver, isMajorBump } from "../compat/semver.mjs";
import { sha256, stableStringify } from "../../compilers/utils.mjs";

const SSOT_DIR = process.env.SSOT_DIR || "./platform/ssot";
const REPORTS_DIR = join(process.cwd(), "runtime", "reports");

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

function requireQuorum(action, targetId, required = 2) {
  const safe = action.replace(/[^a-z0-9-]/gi, "_");
  const path = join(SSOT_DIR, "changes/reviews", `${safe}-${targetId}.json`);
  if (!existsSync(path)) throw new Error("Quorum not met");
  const review = readJson(path);
  const approvals = review.approvals || [];
  if ((review.required_approvals || required) > approvals.length) throw new Error("Quorum not met");
  if (review.status !== "approved") throw new Error("Quorum not met");
}

export function planUpgrade({ from, to }) {
  const matrix = readJson(join(SSOT_DIR, "compat/compatibility_matrix.json"));
  const migrations = readJson(join(SSOT_DIR, "compat/migrations.json"));
  const entry = matrix.find((m) => m.from_version === from && m.to_version === to);
  if (!entry) throw new Error("No compatibility matrix entry for transition");
  if (!entry.allowed) throw new Error("Upgrade not allowed by matrix");
  const plan = {
    from_version: from,
    to_version: to,
    requires_migration: Boolean(entry.requires_migration),
    migration_ids: entry.migration_ids || [],
    migrations: migrations.filter((m) => (entry.migration_ids || []).includes(m.migration_id))
  };
  appendAudit({ event: "upgrade_planned", from_version: from, to_version: to, at: new Date().toISOString() });
  return plan;
}

export function dryRun(plan) {
  mkdirSync(REPORTS_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const out = join(REPORTS_DIR, `UPGRADE_PLAN_${ts}.md`);
  const lines = [
    `Upgrade plan ${plan.from_version} -> ${plan.to_version}`,
    `requires_migration: ${plan.requires_migration}`,
    `migration_ids: ${(plan.migration_ids || []).join(", ")}`
  ];
  writeFileSync(out, lines.join("\n") + "\n");
  appendAudit({ event: "upgrade_dry_run", from_version: plan.from_version, to_version: plan.to_version, at: new Date().toISOString() });
  return out;
}

export function apply(plan) {
  if (isMajorBump(plan.from_version, plan.to_version)) {
    requireQuorum("upgrade", `${plan.from_version}->${plan.to_version}`, 2);
  }
  appendAudit({ event: "upgrade_applied", from_version: plan.from_version, to_version: plan.to_version, at: new Date().toISOString() });
  return true;
}

export function verify({ releaseId }) {
  execSync(`node scripts/ci/compile.mjs ${releaseId} dev`, { stdio: "inherit", env: process.env });
  execSync(`node scripts/ci/run-gates.mjs ${releaseId}`, { stdio: "inherit", env: process.env });
  appendAudit({ event: "upgrade_verified", release_id: releaseId, at: new Date().toISOString() });
  return true;
}

export function rollback({ releaseId, reason }) {
  appendAudit({ event: "upgrade_rolled_back", release_id: releaseId, reason: reason || "manual", at: new Date().toISOString() });
  return true;
}

export function isBreaking(from, to) {
  return parseSemver(from).maj < parseSemver(to).maj;
}
