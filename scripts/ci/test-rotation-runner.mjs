import { execSync } from "child_process";
import { createTempSsot, getReportsDir } from "./test-utils.mjs";
import { writeFileSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";

const temp = createTempSsot();
const ssotDir = temp.ssotDir;

try {
  const secDir = join(ssotDir, "security");
  mkdirSync(secDir, { recursive: true });
  writeFileSync(join(secDir, "secrets_vault_refs.json"), JSON.stringify([
    {
      id: "sec:ref:rot_v1",
      provider: "env",
      ref: "ENV:ROTATION_SECRET",
      kind: "hmac_key",
      created_at: new Date().toISOString(),
      created_by: "test",
      constraints: { no_export: true, redact: true, max_ttl_days: 30, rotation_policy_id: "sec:pol:rotation-30d" }
    },
    {
      id: "sec:ref:rot_v2",
      provider: "env",
      ref: "ENV:ROTATION_SECRET_2",
      kind: "hmac_key",
      created_at: new Date().toISOString(),
      created_by: "test",
      constraints: { no_export: true, redact: true, max_ttl_days: 30, rotation_policy_id: "sec:pol:rotation-30d" }
    }
  ], null, 2) + "\n");
  writeFileSync(join(secDir, "secret_policies.json"), JSON.stringify([
    { id: "sec:pol:rotation-30d", rotation_days: 30, grace_days: 7, allow_dual: true, required_usages: ["webhook_signing"], replay_window_ms: 300000 }
  ], null, 2) + "\n");
  const exp = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
  writeFileSync(join(secDir, "secret_bindings.json"), JSON.stringify([
    {
      id: "sec:bind:test",
      scope: "platform:*",
      usage: "webhook_signing",
      refs: ["sec:ref:rot_v1", "sec:ref:rot_v2"],
      active_ref: "sec:ref:rot_v1",
      next_ref: "sec:ref:rot_v2",
      policy_id: "sec:pol:rotation-30d",
      effective_at: new Date().toISOString(),
      expires_at: exp
    }
  ], null, 2) + "\n");

  execSync("node scripts/maintenance/run-rotation.mjs --dry-run", { stdio: "inherit", env: { ...process.env, SSOT_DIR: ssotDir } });
  const reportsDir = getReportsDir();
  const reports = readdirSync(reportsDir).filter((f) => f.startsWith("ROTATION_REPORT_"));
  if (!reports.length) throw new Error("Rotation report missing");

  let denied = false;
  try {
    execSync("node scripts/maintenance/run-rotation.mjs --apply", { stdio: "ignore", env: { ...process.env, SSOT_DIR: ssotDir } });
  } catch {
    denied = true;
  }
  if (!denied) throw new Error("Expected apply to be denied without quorum/break-glass");

  console.log("Rotation runner PASS");
} finally {
  temp.cleanup();
}
