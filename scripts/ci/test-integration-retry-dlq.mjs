import { execSync } from "child_process";
import { createTempSsot } from "./test-utils.mjs";
import { writeFileSync, mkdirSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import { loadManifest } from "../../platform/runtime/loader/loader.mjs";

async function run() {
  const temp = createTempSsot();
  const runtimeDir = join(temp.ssotDir, "..", "runtime");
  const outDir = join(runtimeDir, "manifests");
  mkdirSync(outDir, { recursive: true });
  process.env.RUNTIME_DIR = runtimeDir;
  process.env.SSOT_DIR = temp.ssotDir;

  const webhooksPath = join(temp.ssotDir, "integrations", "webhooks.json");
  writeFileSync(webhooksPath, JSON.stringify([
    {
      webhook_id: "wh:dlq",
      tenant_id: "tenant:default",
      connector_id: "connector:slack",
      direction: "outbound",
      target_url: "http://localhost:65530/hook",
      signature_required: false,
      retry_policy: { max_attempts: 2, base_delay_ms: 10, max_delay_ms: 20 },
      dlq_enabled: true,
      export_type: "webhook",
      data_model_id: "model:document"
    }
  ], null, 2) + "\n");

  const releaseId = "int-dlq-001";
  execSync(`node scripts/ci/compile.mjs ${releaseId} dev`, { stdio: "inherit", env: { ...process.env, SSOT_DIR: temp.ssotDir, OUT_DIR: outDir } });
  const manifest = loadManifest({ releaseId, stalenessMs: 0, manifestsDir: outDir });
  const { sendWebhook } = await import("../../platform/runtime/integrations/dispatcher.mjs");
  const result = await sendWebhook({ manifest, tenantId: "tenant:default", webhook: manifest.integrations.webhooks[0], event: "test", payload: { id: "x" } });
  if (result.ok) throw new Error("Expected webhook to fail and go to DLQ");

  const dlqDir = join(runtimeDir, "integrations", "dlq", "tenant_default");
  const files = existsSync(dlqDir) ? readdirSync(dlqDir) : [];
  if (!files.length) throw new Error("Expected DLQ file");

  console.log("Integration retry/DLQ PASS");
  temp.cleanup();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
