import http from "http";
import { execSync } from "child_process";
import { createTempSsot } from "./test-utils.mjs";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { loadManifest } from "../../platform/runtime/loader/loader.mjs";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const temp = createTempSsot();
  const outDir = join(temp.ssotDir, "..", "runtime", "manifests");
  mkdirSync(outDir, { recursive: true });
  process.env.SSOT_DIR = temp.ssotDir;
  process.env.RUNTIME_DIR = join(temp.ssotDir, "..", "runtime");

  const fieldsPath = join(temp.ssotDir, "data", "catalog", "data_fields.json");
  const fields = JSON.parse(readFileSync(fieldsPath, "utf-8"));
  fields.push({ field_id: "field:document.ssn", data_model_id: "model:document", path: "ssn", type: "string", classification_id: "pii.high" });
  writeFileSync(fieldsPath, JSON.stringify(fields, null, 2) + "\n");

  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      server.lastBody = body;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    });
  });
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  const webhooksPath = join(temp.ssotDir, "integrations", "webhooks.json");
  writeFileSync(webhooksPath, JSON.stringify([
    {
      webhook_id: "wh:out-test",
      tenant_id: "tenant:default",
      connector_id: "connector:slack",
      direction: "outbound",
      target_url: `http://localhost:${port}/hook`,
      signature_required: false,
      retry_policy: { max_attempts: 1, base_delay_ms: 10, max_delay_ms: 10 },
      dlq_enabled: true,
      export_type: "webhook",
      data_model_id: "model:document"
    }
  ], null, 2) + "\n");

  const subsPath = join(temp.ssotDir, "integrations", "event_subscriptions.json");
  writeFileSync(subsPath, JSON.stringify([
    { subscription_id: "sub:doc", tenant_id: "tenant:default", event: "document.ingested", webhook_id: "wh:out-test", enabled: true }
  ], null, 2) + "\n");

  const releaseId = "int-out-001";
  execSync(`node scripts/ci/compile.mjs ${releaseId} dev`, { stdio: "inherit", env: { ...process.env, SSOT_DIR: temp.ssotDir, OUT_DIR: outDir } });
  const manifest = loadManifest({ releaseId, stalenessMs: 0, manifestsDir: outDir });
  const { emitEvent } = await import("../../platform/runtime/events/bus.mjs");
  await emitEvent({ manifest, tenantId: "tenant:default", event: "document.ingested", payload: { id: "doc1", "field:document.ssn": "123-45-6789" } });
  await sleep(200);

  const lastBody = server.lastBody;
  server.close();
  temp.cleanup();

  if (!lastBody) throw new Error("No webhook received");
  const out = JSON.parse(lastBody);
  if (out.payload["field:document.ssn"] !== "****") throw new Error("Expected masking for pii.high");

  console.log("Integration outbound masking PASS");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
