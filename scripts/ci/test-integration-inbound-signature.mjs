import { spawn, execSync } from "child_process";
import { createTempSsot } from "./test-utils.mjs";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { createHmac } from "crypto";

const api = "http://localhost:7070/api";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const temp = createTempSsot();
  const outDir = join(temp.ssotDir, "..", "runtime", "manifests");
  mkdirSync(outDir, { recursive: true });

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

  const releaseId = "int-in-001";
  execSync(`node scripts/ci/compile.mjs ${releaseId} dev`, { stdio: "inherit", env: { ...process.env, SSOT_DIR: temp.ssotDir, OUT_DIR: outDir } });
  const activePath = join(temp.ssotDir, "changes", "active_release.json");
  writeFileSync(activePath, JSON.stringify({ active_release_id: releaseId, active_env: "dev", updated_at: new Date().toISOString(), updated_by: "test" }, null, 2) + "\n");

  const server = spawn("node", ["apps/backend-api/server.mjs"], { stdio: "inherit", env: { ...process.env, SSOT_DIR: temp.ssotDir, MANIFESTS_DIR: outDir, WEBHOOK_SECRET: "supersecret" } });
  await sleep(500);

  try {
    const body = JSON.stringify({ hello: "world" });
    const noSig = await fetch(`${api}/integrations/webhook/in/${encodeURIComponent("connector:slack")}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-tenant-id": "tenant:default", "x-user-id": "user:admin", "x-scope": "tenant:default:*" },
      body
    });
    if (noSig.status !== 401) throw new Error("Expected missing signature to be rejected");

    const sig = createHmac("sha256", "supersecret").update(body).digest("hex");
    const ok = await fetch(`${api}/integrations/webhook/in/${encodeURIComponent("connector:slack")}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-tenant-id": "tenant:default", "x-user-id": "user:admin", "x-scope": "tenant:default:*", "x-signature": sig },
      body
    });
    if (!ok.ok) throw new Error(`Expected valid signature to pass, got ${ok.status}`);

    console.log("Integration inbound signature PASS");
  } finally {
    server.kill();
    temp.cleanup();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
