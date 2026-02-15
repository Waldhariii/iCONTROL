import { writeReport, writeIndexLine, assertNoForbiddenReportPaths } from "./report-utils.mjs";
import { ensureApiUp, getToken, req } from "./s2s-smoke-utils.mjs";

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {
    baseUrl: process.env.API_BASE || "http://localhost:7070",
    principalId: process.env.S2S_PRINCIPAL || "svc:ci",
    templateId: process.env.TEMPLATE_ID || "tmpl:marketplace-free",
    moduleId: process.env.MODULE_ID || "module:jobs",
    moduleVersion: process.env.MODULE_VERSION || "latest",
    extId: process.env.EXT_ID || "ext:sample",
    extVersion: process.env.EXT_VERSION || "latest"
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--template") out.templateId = args[++i];
    else if (args[i] === "--module") out.moduleId = args[++i];
    else if (args[i] === "--module-version") out.moduleVersion = args[++i];
    else if (args[i] === "--ext") out.extId = args[++i];
    else if (args[i] === "--ext-version") out.extVersion = args[++i];
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
    scopes: ["marketplace.*", "runtime.read", "observability.read", "ops.tenancy.*", "studio.modules.*"]
  });

  const tenantResp = await req("POST", `${args.baseUrl}/api/tenancy/factory/apply`, token, {
    templateId: args.templateId,
    tenantKey: `smoke-${Date.now()}`,
    displayName: "Smoke Tenant"
  });
  const tenantId = tenantResp.data?.tenant_id || tenantResp.data?.tenantId || "tenant:default";

  const impactModule = await req("POST", `${args.baseUrl}/api/marketplace/tenants/${tenantId}/impact`, token, {
    item: { type: "module", id: args.moduleId, version: args.moduleVersion },
    action: "install"
  }, { "x-tenant-id": tenantId });

  const installModule = await req("POST", `${args.baseUrl}/api/marketplace/tenants/${tenantId}/install`, token, {
    type: "module",
    id: args.moduleId,
    version: args.moduleVersion,
    reason: "smoke module install"
  }, { "x-tenant-id": tenantId });

  const enableModule = await req("POST", `${args.baseUrl}/api/marketplace/tenants/${tenantId}/enable`, token, {
    type: "module",
    id: args.moduleId,
    reason: "smoke module enable"
  }, { "x-tenant-id": tenantId });

  const disableModule = await req("POST", `${args.baseUrl}/api/marketplace/tenants/${tenantId}/disable`, token, {
    type: "module",
    id: args.moduleId,
    reason: "smoke module disable"
  }, { "x-tenant-id": tenantId });

  const uninstallModule = await req("POST", `${args.baseUrl}/api/marketplace/tenants/${tenantId}/uninstall`, token, {
    type: "module",
    id: args.moduleId,
    reason: "smoke module uninstall"
  }, { "x-tenant-id": tenantId });

  const impactExt = await req("POST", `${args.baseUrl}/api/marketplace/tenants/${tenantId}/impact`, token, {
    item: { type: "extension", id: args.extId, version: args.extVersion },
    action: "install"
  }, { "x-tenant-id": tenantId });

  const installExt = await req("POST", `${args.baseUrl}/api/marketplace/tenants/${tenantId}/install`, token, {
    type: "extension",
    id: args.extId,
    version: args.extVersion,
    reason: "smoke extension install"
  }, { "x-tenant-id": tenantId });

  const enableExt = await req("POST", `${args.baseUrl}/api/marketplace/tenants/${tenantId}/enable`, token, {
    type: "extension",
    id: args.extId,
    reason: "smoke extension enable"
  }, { "x-tenant-id": tenantId });

  const disableExt = await req("POST", `${args.baseUrl}/api/marketplace/tenants/${tenantId}/disable`, token, {
    type: "extension",
    id: args.extId,
    reason: "smoke extension disable"
  }, { "x-tenant-id": tenantId });

  const uninstallExt = await req("POST", `${args.baseUrl}/api/marketplace/tenants/${tenantId}/uninstall`, token, {
    type: "extension",
    id: args.extId,
    reason: "smoke extension uninstall"
  }, { "x-tenant-id": tenantId });

  const report = [
    "# Smoke Marketplace API",
    `tenant_id: ${tenantId}`,
    `template: ${args.templateId}`,
    `module: ${args.moduleId}@${args.moduleVersion}`,
    `extension: ${args.extId}@${args.extVersion}`,
    `impact_module_status: ${impactModule.status}`,
    `install_module_status: ${installModule.status}`,
    `enable_module_status: ${enableModule.status}`,
    `disable_module_status: ${disableModule.status}`,
    `uninstall_module_status: ${uninstallModule.status}`,
    `impact_ext_status: ${impactExt.status}`,
    `install_ext_status: ${installExt.status}`,
    `enable_ext_status: ${enableExt.status}`,
    `disable_ext_status: ${disableExt.status}`,
    `uninstall_ext_status: ${uninstallExt.status}`
  ].join("\n");

  const reportPath = writeReport("SMOKE_MARKETPLACE_API", report);
  writeIndexLine("smoke_api", {
    ts: new Date().toISOString(),
    type: "marketplace",
    tenant_id: tenantId,
    report_path: reportPath
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
