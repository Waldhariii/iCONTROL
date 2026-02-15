import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { execSync } from "child_process";
import { createTempSsot, getReportsDir, assertNoPlatformReportsPath } from "../ci/test-utils.mjs";

const QUICK = process.argv.includes("--quick") || process.env.DEMO_QUICK === "1";
const reportsDir = getReportsDir();
assertNoPlatformReportsPath(reportsDir);
mkdirSync(reportsDir, { recursive: true });

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

function ensureTemplates(ssotDir) {
  const templatesPath = join(ssotDir, "tenancy", "tenant_templates.json");
  const templates = readJson(templatesPath);
  const base = templates.find((t) => t.template_id === "tmpl:default") || templates[0];
  if (!base) throw new Error("No base tenant template found");

  const mk = (id, modules, basePlanId = base.base_plan_id) => ({
    ...base,
    template_id: id,
    name: id.replace("tmpl:", ""),
    base_plan_id: basePlanId,
    module_activations_default: modules.map((m) => ({ module_id: m, state: "active" }))
  });

  const desired = [
    mk("tmpl:jobs_only", ["module:jobs"], "plan:free"),
    mk("tmpl:docs_only", ["module:documents"], "plan:free"),
    mk("tmpl:billing_only", ["module:billing"], "plan:pro"),
    mk("tmpl:all_three", ["module:jobs", "module:documents", "module:billing"], "plan:pro")
  ];

  const byId = new Map(templates.map((t) => [t.template_id, t]));
  for (const t of desired) {
    byId.set(t.template_id, t);
  }

  writeJson(templatesPath, Array.from(byId.values()));
}

function writeActiveRelease(ssotDir, releaseId) {
  const path = join(ssotDir, "changes", "active_release.json");
  const payload = {
    active_release_id: releaseId,
    active_env: "dev",
    updated_at: new Date().toISOString(),
    updated_by: "demo"
  };
  writeJson(path, payload);
}

function extractSnapshot({ manifest, tenantId }) {
  const activations = (manifest.module_activations || []).filter(
    (m) => m.tenant_id === tenantId && m.state === "active"
  );
  const activeModuleIds = activations.map((m) => m.module_id);
  const routes = (manifest.routes?.routes || [])
    .filter((r) => r.surface === "client")
    .map((r) => r.path);
  const nav = (manifest.nav?.nav_specs || [])
    .filter((n) => n.surface === "client")
    .map((n) => n.path || n.label || n.id);
  const pages = (manifest.pages?.pages || [])
    .filter((p) => p.surface === "client")
    .map((p) => p.key || p.id);
  return { activeModuleIds, routes, nav, pages };
}

async function runDemo({ ssotDir, outDir, templateId }) {
  const repoRoot = process.cwd();
  process.env.SSOT_DIR = ssotDir;
  process.env.MANIFESTS_DIR = outDir;

  const { planTenantCreate, dryRunCreate, applyCreate } = await import("../../platform/runtime/tenancy/factory.mjs");

  const tenantKey = `${templateId.replace("tmpl:", "")}-${Date.now()}`;
  const tempRoot = dirname(dirname(ssotDir));
  process.chdir(tempRoot);
  mkdirSync(join(tempRoot, "platform", "runtime", "changes"), { recursive: true });
  const plan = planTenantCreate({ templateId, tenantKey, displayName: tenantKey, ownerUserId: "demo" });
  dryRunCreate(plan);
  const changesetId = applyCreate(plan);
  process.chdir(repoRoot);

  const releaseId = `demo-${templateId.replace("tmpl:", "")}-${Date.now()}`;
  execSync(`node scripts/ci/compile.mjs ${releaseId} dev`, {
    stdio: "inherit",
    env: { ...process.env, SSOT_DIR: ssotDir, OUT_DIR: outDir }
  });
  execSync(`node governance/gates/run-gates.mjs ${releaseId}`, {
    stdio: "inherit",
    env: { ...process.env, SSOT_DIR: ssotDir, MANIFESTS_DIR: outDir }
  });

  writeActiveRelease(ssotDir, releaseId);

  const manifestPath = join(outDir, `platform_manifest.${releaseId}.json`);
  const manifest = readJson(manifestPath);
  const snapshot = extractSnapshot({ manifest, tenantId: plan.tenant_id });

  return {
    templateId,
    tenantId: plan.tenant_id,
    releaseId,
    changesetId,
    snapshot
  };
}

const temp = createTempSsot();
const ssotDir = temp.ssotDir;
const tempRoot = dirname(dirname(ssotDir));
const outDir = join(tempRoot, "runtime", "manifests");
mkdirSync(outDir, { recursive: true });

ensureTemplates(ssotDir);

const demoTemplates = QUICK
  ? ["tmpl:jobs_only"]
  : ["tmpl:jobs_only", "tmpl:docs_only", "tmpl:billing_only", "tmpl:all_three"];

const results = [];
for (const t of demoTemplates) {
  const r = await runDemo({ ssotDir, outDir, templateId: t });
  results.push(r);
}

const ts = new Date().toISOString().replace(/[:.]/g, "-");
const reportPath = join(reportsDir, `DEMO_REPORT_${ts}.md`);
const snapshotPath = join(reportsDir, `DEMO_MANIFEST_SNAPSHOT_${ts}.json`);
assertNoPlatformReportsPath(reportPath);
assertNoPlatformReportsPath(snapshotPath);

const lines = [
  "# Module Activation Demo",
  `Generated: ${ts}`,
  "",
  `Templates: ${demoTemplates.join(", ")}`,
  ""
];

const getByTemplate = (id) => results.find((r) => r.templateId === id);
const jobs = getByTemplate("tmpl:jobs_only");
const docs = getByTemplate("tmpl:docs_only");
const billing = getByTemplate("tmpl:billing_only");

for (const r of results) {
  const s = r.snapshot;
  lines.push(`## ${r.templateId}`);
  lines.push(`tenant_id: ${r.tenantId}`);
  lines.push(`release_id: ${r.releaseId}`);
  lines.push(`modules_active: ${s.activeModuleIds.join(", ")}`);
  lines.push(`routes_count: ${s.routes.length}`);
  lines.push(`nav_count: ${s.nav.length}`);
  lines.push(`pages_count: ${s.pages.length}`);
  lines.push("client_paths (top 10):");
  lines.push(...s.routes.slice(0, 10).map((p) => `- ${p}`));
  lines.push("");
}

if (docs && jobs) {
  const missing = jobs.snapshot.routes.filter((p) => !docs.snapshot.routes.includes(p));
  lines.push("## Absence proof (docs_only excludes jobs)");
  lines.push(missing.length ? missing.slice(0, 10).map((p) => `- ${p}`).join("\n") : "- none");
  lines.push("");
}
if (billing && jobs) {
  const missing = jobs.snapshot.routes.filter((p) => !billing.snapshot.routes.includes(p));
  lines.push("## Absence proof (billing_only excludes jobs)");
  lines.push(missing.length ? missing.slice(0, 10).map((p) => `- ${p}`).join("\n") : "- none");
  lines.push("");
}

writeFileSync(reportPath, lines.join("\n") + "\n", "utf-8");
writeJson(snapshotPath, results.map((r) => ({
  template_id: r.templateId,
  tenant_id: r.tenantId,
  release_id: r.releaseId,
  modules_active: r.snapshot.activeModuleIds,
  routes: r.snapshot.routes,
  nav: r.snapshot.nav,
  pages: r.snapshot.pages
})));

console.log(`Demo report written: ${reportPath}`);
console.log(`Demo snapshot written: ${snapshotPath}`);

temp.cleanup();
