import { spawn, execSync } from "child_process";
import { createTempSsot } from "./test-utils.mjs";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const api = "http://localhost:7070/api";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const temp = createTempSsot();
  const outDir = join(temp.ssotDir, "..", "runtime", "manifests");
  mkdirSync(outDir, { recursive: true });
  const fieldsPath = join(temp.ssotDir, "data", "catalog", "data_fields.json");
  const fields = JSON.parse(readFileSync(fieldsPath, "utf-8"));
  fields.push({ field_id: "field:document.ssn", data_model_id: "model:document", path: "ssn", type: "string", classification_id: "pii.high" });
  writeFileSync(fieldsPath, JSON.stringify(fields, null, 2) + "\n");

  const releaseId = "dgmask-001";
  execSync(`node scripts/ci/compile.mjs ${releaseId} dev`, { stdio: "inherit", env: { ...process.env, SSOT_DIR: temp.ssotDir, OUT_DIR: outDir } });
  const activePath = join(temp.ssotDir, "changes", "active_release.json");
  writeFileSync(activePath, JSON.stringify({ active_release_id: releaseId, active_env: "dev", updated_at: new Date().toISOString(), updated_by: "test" }, null, 2) + "\n");
  const reviewDir = join(temp.ssotDir, "changes", "reviews");
  mkdirSync(reviewDir, { recursive: true });
  writeFileSync(join(reviewDir, "data_export-tenant:default.json"), JSON.stringify({
    id: "data_export-tenant_default",
    action: "data_export",
    target_id: "tenant:default",
    required_approvals: 2,
    approvals: ["user:admin", "user:admin2"],
    status: "approved"
  }, null, 2) + "\n");

  const server = spawn("node", ["apps/backend-api/server.mjs"], { stdio: "inherit", env: { ...process.env, SSOT_DIR: temp.ssotDir, MANIFESTS_DIR: outDir } });
  await sleep(500);

  try {
    const payload = {
      tenant_id: "tenant:default",
      export_type: "dataset",
      records: [{ id: "1", ssn: "123-45-6789" }]
    };
    const res = await fetch(`${api}/data/export`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": "user:admin", "x-scope": "platform:*" },
      body: JSON.stringify(payload)
    });
    const out = await res.json();
    if (!res.ok) throw new Error(`Export failed: ${res.status} ${JSON.stringify(out)}`);
    if (out.records[0].ssn !== "***") throw new Error("Expected masking for pii.high");
    console.log("Data governance export masking PASS");
  } finally {
    server.kill();
    temp.cleanup();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
