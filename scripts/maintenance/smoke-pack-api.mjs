import { writeReport, writeIndexLine, assertNoForbiddenReportPaths } from "./report-utils.mjs";
import { pickLatestPackDir } from "./release-pack-utils.mjs";
import { ensureApiUp, getToken, req } from "./s2s-smoke-utils.mjs";

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {
    baseUrl: process.env.API_BASE || "http://localhost:7070",
    principalId: process.env.S2S_PRINCIPAL || "svc:ci",
    dryRun: false,
    pack: ""
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--pack") out.pack = args[++i];
    else if (args[i] === "--principal") out.principalId = args[++i];
    else if (args[i] === "--dry-run") out.dryRun = true;
  }
  return out;
}

async function main() {
  const args = parseArgs();
  assertNoForbiddenReportPaths();
  await ensureApiUp(args.baseUrl);

  const secret = process.env.S2S_CI_HMAC || process.env.S2S_CP_HMAC || "";
  if (!secret) throw new Error("Missing S2S HMAC secret (S2S_CI_HMAC or S2S_CP_HMAC)");

  const token = await getToken({
    baseUrl: args.baseUrl,
    principalId: args.principalId,
    secret,
    scopes: ["ops.packs.*", "studio.releases.rollback", "runtime.read", "observability.read", "ops.tenancy.*", "marketplace.*"]
  });

  const packDir = args.pack || pickLatestPackDir();
  if (!packDir) throw new Error("No pack found");

  const before = await req("GET", `${args.baseUrl}/api/runtime/active-release`, token);

  const tenantResp = await req("POST", `${args.baseUrl}/api/tenancy/factory/apply`, token, {
    templateId: "tmpl:marketplace-free",
    tenantKey: `smoke-${Date.now()}`,
    displayName: "Smoke Tenant"
  });
  const tenantId = tenantResp.data?.tenant_id || tenantResp.data?.tenantId || "tenant:default";

  const importRes = await req("POST", `${args.baseUrl}/api/packs/import`, token, {
    pack_path: packDir,
    mode: "staging"
  });
  const stagingId = importRes.data?.staging_id || importRes.data?.stagingId || "";

  let activateRes = { status: 0, data: {} };
  if (!args.dryRun) {
    activateRes = await req("POST", `${args.baseUrl}/api/packs/activate`, token, { staging_id: stagingId });
  }

  const manifestRes = await req("GET", `${args.baseUrl}/api/runtime/manifest`, token, null, { "x-tenant-id": tenantId });
  const preflightRes = await req("GET", `${args.baseUrl}/api/marketplace/tenants/${tenantId}/preflight`, token, null, { "x-tenant-id": tenantId });
  const qosRes = await req("GET", `${args.baseUrl}/api/qos/status?tenant=${tenantId}`, token, null, { "x-tenant-id": tenantId });

  let rollbackRes = { status: 0, data: {} };
  const beforeId = before.data?.active_release_id;
  if (!args.dryRun && beforeId) {
    rollbackRes = await req("POST", `${args.baseUrl}/api/releases/${beforeId}/rollback`, token, { reason: "smoke rollback" });
  }

  const report = [
    "# Smoke Pack API",
    `pack: ${packDir}`,
    `staging_id: ${stagingId}`,
    `active_before: ${beforeId || ""}`,
    `activate_status: ${activateRes.status}`,
    `manifest_status: ${manifestRes.status}`,
    `preflight_status: ${preflightRes.status}`,
    `qos_status: ${qosRes.status}`,
    `rollback_status: ${rollbackRes.status}`
  ].join("\n");

  const reportPath = writeReport("SMOKE_PACK_API", report);
  writeIndexLine("smoke_api", {
    ts: new Date().toISOString(),
    type: "pack",
    pack: packDir,
    staging_id: stagingId,
    report_path: reportPath
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
