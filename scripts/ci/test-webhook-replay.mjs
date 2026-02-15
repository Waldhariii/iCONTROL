import { spawn, execSync } from "child_process";
import { createTempSsot } from "./test-utils.mjs";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { createHmac, randomUUID } from "crypto";

const api = "http://localhost:7070/api";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const temp = createTempSsot();
  const outDir = join(temp.ssotDir, "..", "runtime", "manifests");
  mkdirSync(outDir, { recursive: true });

  const secDir = join(temp.ssotDir, "security");
  mkdirSync(secDir, { recursive: true });
  writeFileSync(join(secDir, "secrets_vault_refs.json"), JSON.stringify([
    {
      id: "sec:ref:webhook_hmac_v1",
      provider: "env",
      ref: "ENV:WEBHOOK_SECRET",
      kind: "hmac_key",
      created_at: new Date().toISOString(),
      created_by: "test",
      constraints: { no_export: true, redact: true, max_ttl_days: 30, rotation_policy_id: "sec:pol:rotation-30d" }
    }
  ], null, 2) + "\n");
  writeFileSync(join(secDir, "secret_policies.json"), JSON.stringify([
    { id: "sec:pol:rotation-30d", rotation_days: 30, grace_days: 7, allow_dual: true, required_usages: ["webhook_signing"], replay_window_ms: 300000 }
  ], null, 2) + "\n");
  writeFileSync(join(secDir, "secret_bindings.json"), JSON.stringify([
    {
      id: "sec:bind:webhook_signing:platform",
      scope: "platform:*",
      usage: "webhook_signing",
      refs: ["sec:ref:webhook_hmac_v1"],
      active_ref: "sec:ref:webhook_hmac_v1",
      next_ref: null,
      policy_id: "sec:pol:rotation-30d",
      effective_at: new Date().toISOString()
    }
  ], null, 2) + "\n");

  const secretsPath = join(temp.ssotDir, "integrations", "secrets_vault_refs.json");
  writeFileSync(secretsPath, JSON.stringify([
    { ref_id: "ref:wh-secret", tenant_id: "tenant:default", kind: "hmac_secret", provider: "local_env", pointer: "WEBHOOK_SECRET" }
  ], null, 2) + "\n");

  const webhooksPath = join(temp.ssotDir, "integrations", "webhooks.json");
  writeFileSync(webhooksPath, JSON.stringify([
    {
      webhook_id: "wh:in-test",
      tenant_id: "tenant:default",
      connector_id: "connector:slack",
      direction: "inbound",
      signature_required: true,
      signature_header: "x-signature",
      secret_ref_id: "ref:wh-secret"
    }
  ], null, 2) + "\n");

  const releaseId = "int-replay-001";
  execSync(`node scripts/ci/compile.mjs ${releaseId} dev`, { stdio: "inherit", env: { ...process.env, SSOT_DIR: temp.ssotDir, OUT_DIR: outDir } });
  const activePath = join(temp.ssotDir, "changes", "active_release.json");
  writeFileSync(activePath, JSON.stringify({ active_release_id: releaseId, active_env: "dev", updated_at: new Date().toISOString(), updated_by: "test" }, null, 2) + "\n");

  const server = spawn("node", ["apps/backend-api/server.mjs"], { stdio: "inherit", env: { ...process.env, SSOT_DIR: temp.ssotDir, MANIFESTS_DIR: outDir, WEBHOOK_SECRET: "supersecret" } });
  await sleep(500);

  try {
    const body = JSON.stringify({ hello: "world" });
    const ts = (Date.now() - 10 * 60 * 1000).toString();
    const sig = createHmac("sha256", "supersecret").update(`${ts}.${body}`).digest("base64");
    const reqId = randomUUID();
    const res = await fetch(`${api}/integrations/webhook/in/${encodeURIComponent("connector:slack")}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": "tenant:default",
        "x-user-id": "user:admin",
        "x-scope": "tenant:default:*",
        "x-request-id": reqId,
        "x-timestamp": ts,
        "x-signature": sig
      },
      body
    });
    if (res.status !== 401) throw new Error(`Expected replay to be rejected, got ${res.status}`);
    console.log("Webhook replay protection PASS");
  } finally {
    server.kill();
    temp.cleanup();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
