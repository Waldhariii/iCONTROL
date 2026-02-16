/**
 * Phase AM: Tenant provisioner — zero-touch provisioning with PROVISION_REPORT + index.
 */
import { writeFileSync, mkdirSync, appendFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { planTenantCreate, applyCreate } from "./factory.mjs";

/**
 * @param {{
 *   tenant_id: string,
 *   template_id?: string,
 *   plan_id?: string,
 *   correlation_id: string,
 *   ssotDir: string,
 *   reportsDir: string
 * }} opts
 * @returns {{ ok: boolean, tenant_id: string, correlation_id: string, report_dir: string, error?: string }}
 */
export function provisionTenant(opts) {
  const { tenant_id, template_id, plan_id, correlation_id, reportsDir } = opts;
  const reportDir = join(reportsDir, "tenants", correlation_id || `provision-${Date.now()}`);
  mkdirSync(reportDir, { recursive: true });

  const tenantKey = String(tenant_id || "").replace(/^tenant:/, "") || `tenant-${Date.now()}`;
  const effectiveTenantId = tenant_id && tenant_id.startsWith("tenant:") ? tenant_id : `tenant:${tenantKey}`;

  try {
    const plan = planTenantCreate({
      templateId: template_id || "tmpl:default",
      tenantKey,
      displayName: effectiveTenantId,
      ownerUserId: "provisioner"
    });
    if (plan_id) plan.base_plan_id = plan_id;
    plan.tenant_id = effectiveTenantId;
    const changesetId = applyCreate(plan);

    const report = {
      action: "provision",
      tenant_id: effectiveTenantId,
      template_id: template_id || "tmpl:default",
      plan_id: plan.base_plan_id || plan_id,
      correlation_id,
      changeset_id: changesetId,
      at: new Date().toISOString(),
      ok: true
    };
    writeFileSync(join(reportDir, "PROVISION_REPORT.json"), JSON.stringify(report, null, 2), "utf-8");
    writeFileSync(
      join(reportDir, "PROVISION_REPORT.md"),
      `# Provision Report\n\ntenant_id: ${effectiveTenantId}\ntemplate_id: ${report.template_id}\nplan_id: ${report.plan_id}\ncorrelation_id: ${correlation_id}\nchangeset_id: ${changesetId}\nok: true\n`,
      "utf-8"
    );

    const indexDir = join(reportsDir, "index");
    mkdirSync(indexDir, { recursive: true });
    const indexLine = JSON.stringify({
      ts: new Date().toISOString(),
      action: "provision",
      tenant_id: effectiveTenantId,
      template_id: report.template_id,
      correlation_id,
      changeset_id: changesetId
    }) + "\n";
    appendFileSync(join(indexDir, "tenants_latest.jsonl"), indexLine, "utf-8");

    return { ok: true, tenant_id: effectiveTenantId, correlation_id, report_dir: reportDir };
  } catch (err) {
    const report = {
      action: "provision",
      tenant_id: effectiveTenantId,
      template_id: template_id || "tmpl:default",
      correlation_id,
      at: new Date().toISOString(),
      ok: false,
      error: String(err && err.message || err)
    };
    writeFileSync(join(reportDir, "PROVISION_REPORT.json"), JSON.stringify(report, null, 2), "utf-8");
    writeFileSync(
      join(reportDir, "PROVISION_REPORT.md"),
      `# Provision Report\n\ntenant_id: ${effectiveTenantId}\ncorrelation_id: ${correlation_id}\nok: false\nerror: ${report.error}\n`,
      "utf-8"
    );
    const indexDir = join(reportsDir, "index");
    mkdirSync(indexDir, { recursive: true });
    appendFileSync(
      join(indexDir, "tenants_latest.jsonl"),
      JSON.stringify({ ts: report.at, action: "provision", tenant_id: effectiveTenantId, correlation_id, ok: false, error: report.error }) + "\n",
      "utf-8"
    );
    return { ok: false, tenant_id: effectiveTenantId, correlation_id, report_dir: reportDir, error: report.error };
  }
}
