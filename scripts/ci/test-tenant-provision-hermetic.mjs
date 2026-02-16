/**
 * Phase AM: Tenant provision hermetic — PORT=0, S2S, verify PROVISION_REPORT + index + tenant in SSOT.
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { createTempSsot, getS2SToken } from "./test-utils.mjs";
import { spawnServer, waitForBound, getBaseUrl, killServer } from "../../platform/runtime/testing/spawn-server.mjs";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const temp = createTempSsot();
  const reportsDir = join(process.cwd(), "runtime", "reports");

  const { process: server, stdoutChunks } = spawnServer({
    cwd: process.cwd(),
    env: { ...process.env, SSOT_DIR: temp.ssotDir, S2S_CP_HMAC: "dummy", S2S_TOKEN_SIGN: "dummy" }
  });
  const bound = await waitForBound({ stdoutChunks, timeoutMs: 15000 });
  const baseUrl = getBaseUrl(bound);
  const api = `${baseUrl}/api`;
  await sleep(200);

  const token = await getS2SToken({ baseUrl, principalId: "svc:cp", secret: "dummy", scopes: ["tenancy.factory.*"] });
  const authHeaders = { authorization: `Bearer ${token}` };

  const correlationId = `provision-${Date.now()}`;
  const tenantId = "tenant:am-provision-test";
  const res = await fetch(`${api}/tenants/provision`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({
      tenant_id: tenantId,
      template_id: "tmpl:default",
      correlation_id: correlationId
    })
  });
  if (res.status !== 200) throw new Error(`provision status ${res.status}: ${await res.text()}`);

  const reportDir = join(reportsDir, "tenants", correlationId);
  if (!existsSync(reportDir)) throw new Error(`missing report dir ${reportDir}`);
  if (!existsSync(join(reportDir, "PROVISION_REPORT.json"))) throw new Error("missing PROVISION_REPORT.json");
  if (!existsSync(join(reportDir, "PROVISION_REPORT.md"))) throw new Error("missing PROVISION_REPORT.md");
  const report = JSON.parse(readFileSync(join(reportDir, "PROVISION_REPORT.json"), "utf-8"));
  if (report.correlation_id !== correlationId || report.tenant_id !== tenantId || !report.ok) throw new Error("provision report mismatch");

  const indexPath = join(reportsDir, "index", "tenants_latest.jsonl");
  if (!existsSync(indexPath)) throw new Error("missing tenants_latest.jsonl");
  const indexLines = readFileSync(indexPath, "utf-8").trim().split("\n").filter(Boolean);
  const lastLine = indexLines.length ? JSON.parse(indexLines[indexLines.length - 1]) : null;
  if (!lastLine || lastLine.action !== "provision" || lastLine.tenant_id !== tenantId) throw new Error("index entry mismatch");

  const tenantsPath = join(temp.ssotDir, "tenancy", "tenants.json");
  const tenants = JSON.parse(readFileSync(tenantsPath, "utf-8"));
  if (!tenants.some((t) => t.tenant_id === tenantId)) throw new Error("tenant not in SSOT tenants.json");

  killServer(server);
  temp.cleanup();
  console.log("Tenant provision hermetic PASS");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
