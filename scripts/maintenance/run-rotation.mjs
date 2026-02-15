import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { execSync } from "child_process";
import { getReportsDir, assertNoPlatformReportsPath } from "../ci/test-utils.mjs";

const SSOT_DIR = process.env.SSOT_DIR || "./platform/ssot";
const args = process.argv.slice(2);
const apply = args.includes("--apply");
const dryRun = !apply || args.includes("--dry-run");
const now = Date.now();
const requestId = `rotation-${now}`;

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

function hasQuorum() {
  const dir = join(SSOT_DIR, "changes", "reviews");
  if (!existsSync(dir)) return false;
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  for (const f of files) {
    try {
      const review = readJson(join(dir, f));
      if (review.status === "approved" && String(review.action || "").includes("rotation")) return true;
    } catch {
      // ignore
    }
  }
  return false;
}

function breakGlassEnabled() {
  const path = join(SSOT_DIR, "governance", "break_glass.json");
  if (!existsSync(path)) return false;
  const bg = readJson(path);
  const exp = Date.parse(bg.expires_at || "");
  return bg.enabled === true && Number.isFinite(exp) && exp > Date.now();
}

function planRotation() {
  const bindings = readJson(join(SSOT_DIR, "security", "secret_bindings.json"));
  const policies = readJson(join(SSOT_DIR, "security", "secret_policies.json"));
  const plan = [];
  for (const b of bindings) {
    const policy = policies.find((p) => p.id === b.policy_id);
    if (!policy) continue;
    if (!b.expires_at) continue;
    const exp = Date.parse(b.expires_at);
    if (!Number.isFinite(exp)) continue;
    const graceMs = (policy.grace_days || 0) * 24 * 60 * 60 * 1000;
    if (exp - graceMs > now) continue;
    if (!b.next_ref) continue;
    plan.push({ binding_id: b.id, active_ref: b.active_ref, next_ref: b.next_ref, policy_id: b.policy_id });
  }
  return plan;
}

function applyRotation(plan) {
  const bindingsPath = join(SSOT_DIR, "security", "secret_bindings.json");
  const bindings = readJson(bindingsPath);
  const policies = readJson(join(SSOT_DIR, "security", "secret_policies.json"));
  const updates = [];
  for (const item of plan) {
    const idx = bindings.findIndex((b) => b.id === item.binding_id);
    if (idx < 0) continue;
    const policy = policies.find((p) => p.id === item.policy_id);
    const rotationMs = (policy?.rotation_days || 30) * 24 * 60 * 60 * 1000;
    const updated = {
      ...bindings[idx],
      active_ref: item.next_ref,
      next_ref: null,
      effective_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + rotationMs).toISOString()
    };
    bindings[idx] = updated;
    updates.push(updated);
  }
  const csId = `cs-rotation-${now}`;
  const csPath = join(SSOT_DIR, "changes", "changesets", `${csId}.json`);
  mkdirSync(dirname(csPath), { recursive: true });
  const cs = {
    id: csId,
    status: "draft",
    created_by: "rotation-runner",
    created_at: new Date().toISOString(),
    scope: "global",
    ops: updates.map((b) => ({
      op: "update",
      target: { kind: "secret_binding", ref: b.id },
      value: b,
      preconditions: { expected_exists: true }
    }))
  };
  writeJson(csPath, cs);
  execSync(`node scripts/ci/release.mjs --from-changeset ${csId} --env dev --strategy canary`, { stdio: "inherit", env: { ...process.env, SSOT_DIR } });
  return csId;
}

const plan = planRotation();
const reportsDir = getReportsDir();
assertNoPlatformReportsPath(reportsDir);
mkdirSync(reportsDir, { recursive: true });
const ts = new Date().toISOString().replace(/[:.]/g, "-");
const reportPath = join(reportsDir, `ROTATION_REPORT_${ts}.md`);

let changesetId = "";
if (!dryRun) {
  if (!breakGlassEnabled() && !hasQuorum()) {
    writeFileSync(reportPath, `# Rotation Report\nrequest_id: ${requestId}\nstatus: denied\nreason: quorum_or_breakglass_required\n`, "utf-8");
    console.error("Rotation apply denied: quorum or break-glass required");
    process.exit(2);
  }
  changesetId = applyRotation(plan);
}

const lines = [
  "# Rotation Report",
  `request_id: ${requestId}`,
  `changeset_id: ${changesetId || ""}`,
  `mode: ${dryRun ? "dry-run" : "apply"}`,
  `bindings_count: ${plan.length}`,
  ""
];
for (const p of plan) {
  lines.push(`- ${p.binding_id}: ${p.active_ref} -> ${p.next_ref}`);
}
writeFileSync(reportPath, lines.join("\n") + "\n", "utf-8");
console.log(`Rotation report written: ${reportPath}`);
