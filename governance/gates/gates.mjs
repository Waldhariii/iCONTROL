import { readFileSync, existsSync, readdirSync } from "fs";
import { execSync } from "child_process";
import { join } from "path";
import { stableStringify, sha256, verifyPayload } from "../../platform/compilers/utils.mjs";
import { validateOrThrow } from "../../core/contracts/schema/validate.mjs";
import { validateSsotDir } from "../../core/contracts/schema/validate-ssot.mjs";
import { isValidSemver, isMajorBump } from "../../platform/runtime/compat/semver.mjs";

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function readJsonIfExists(path) {
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

function unique(values) {
  return new Set(values).size === values.length;
}

const EXT_ALLOWED_CAPS = ["finops.read", "qos.read", "documents.ingest", "jobs.create"];
const EXT_ALLOWED_EVENTS = ["on_document_ingested", "on_workflow_completed", "on_budget_threshold", "on_qos_incident"];
const EXT_ALLOWED_HANDLERS = ["enqueue_workflow", "write_dead_letter", "emit_webhook"];
const SECRET_KEYS = ["secret", "token", "api_key", "apikey", "password"];
const SECRET_PATTERNS = [
  /sk_live_/i,
  /Bearer\s+[A-Za-z0-9\-_\.=]+/i,
  /Authorization:\s*Bearer\s+[A-Za-z0-9\-_\.=]+/i,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/,
  /AKIA[0-9A-Z]{16}/,
  /-----BEGIN [A-Z ]+ PRIVATE KEY-----/,
  /xoxb-[A-Za-z0-9-]+/i,
  /[A-Za-z0-9+/]{200,}={0,2}/
];
const OPS_ALLOWED_ACTIONS = [
  "qos.throttle",
  "qos.shed",
  "release.rollback",
  "release.compile",
  "release.activate",
  "packs.import",
  "packs.activate",
  "dr_drill.from_pack",
  "rotation.dry_run",
  "bootstrap.proof",
  "extension.killswitch",
  "change.freeze",
  "integration.disable",
  "open.break_glass",
  "close.break_glass",
  "tenancy.factory.plan",
  "tenancy.factory.apply",
  "tenancy.factory.clone.plan",
  "tenancy.factory.clone.apply"
];
const ARTIFACT_PREVIEW_MAX = 200;
const ARTIFACT_SNAP_MAX = 200;
const CORE_RESTRICTED_PREFIXES = ["apps/", "core/", "platform/", "governance/", "scripts/"];
const CORE_ALLOWLIST_PREFIXES = [
  "docs/",
  "governance/gates/",
  "scripts/maintenance/",
  "scripts/ci/",
  "platform/compilers/page-compiler.mjs",
  "platform/compilers/nav-compiler.mjs",
  "platform/runtime/changes/patch-engine.mjs",
  "core/contracts/schemas/nav_spec.schema.json",
  "core/contracts/schemas/nav_manifest.schema.json",
  "core/contracts/schemas/render_graph.schema.json",
  "core/contracts/schemas/page_version.schema.json",
  "core/contracts/schema/validate-ssot.mjs",
  "core/contracts/schemas-index.json",
  "platform/ssot/modules/",
  "platform/ssot/data/",
  "platform/ssot/studio/pages/page_instances.json",
  "platform/ssot/studio/widgets/",
  "platform/ssot/studio/forms/",
  "platform/ssot/changes/changesets/",
  "apps/backend-api/server.mjs",
  "apps/control-plane/public/app.js",
  "apps/client-app/public/app.js",
  "platform/ssot/studio/routes/route_specs.json",
  "platform/ssot/studio/nav/nav_specs.json",
  "platform/ssot/studio/pages/page_definitions.json"
];
const CORE_IGNORE_PATHS = ["platform/ssot/governance/audit_ledger.json"];


function parseSemver(v) {
  const [maj, min, pat] = String(v || "0.0.0").split(".").map((n) => Number(n));
  return { maj: maj || 0, min: min || 0, pat: pat || 0 };
}

function semverGte(a, b) {
  if (a.maj !== b.maj) return a.maj > b.maj;
  if (a.min !== b.min) return a.min > b.min;
  return a.pat >= b.pat;
}

function compareSemver(a, b) {
  if (a.maj !== b.maj) return a.maj - b.maj;
  if (a.min !== b.min) return a.min - b.min;
  return a.pat - b.pat;
}

function normalizePath(p) {
  return String(p || "").replace(/\\/g, "/").replace(/^\.\//, "");
}

function isAllowedCorePath(p) {
  const path = normalizePath(p);
  return CORE_ALLOWLIST_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix));
}

function isRestrictedCorePath(p) {
  const path = normalizePath(p);
  return CORE_RESTRICTED_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function getChangedPaths() {
  if (process.env.CORE_CHANGE_PATHS) {
    return String(process.env.CORE_CHANGE_PATHS)
      .split(/[,\n]/)
      .map((p) => p.trim())
      .filter(Boolean);
  }
  try {
    const out = execSync("git status --porcelain", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    if (!out) return [];
    return out
      .split("\n")
      .map((line) => line.slice(3).trim())
      .map((p) => {
        const arrow = p.lastIndexOf("->");
        return arrow >= 0 ? p.slice(arrow + 2).trim() : p;
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function schemaGate({ ssotDir, manifestsDir, releaseId }) {
  validateSsotDir(ssotDir);

  const base = manifestsDir || "./runtime/manifests";
  const routeCatalog = readJson(`${base}/route_catalog.${releaseId}.json`);
  const navManifest = readJson(`${base}/nav_manifest.${releaseId}.json`);
  const themeManifest = readJson(`${base}/theme_manifest.${releaseId}.json`);
  const guards = readJson(`${base}/guards.${releaseId}.json`);
  const renderGraph = readJson(`${base}/render_graph.${releaseId}.json`);
  const datasource = readJson(`${base}/datasource_contracts.${releaseId}.json`);
  const workflows = readJson(`${base}/workflow_dags.${releaseId}.json`);
  const checksums = readJson(`${base}/checksums.${releaseId}.json`);
  const manifest = readJson(`${base}/platform_manifest.${releaseId}.json`);

  validateOrThrow("route_catalog.v1", routeCatalog, "route_catalog");
  validateOrThrow("nav_manifest.v1", navManifest, "nav_manifest");
  validateOrThrow("theme_manifest.v1", themeManifest, "theme_manifest");
  validateOrThrow("guards.v1", guards, "guards");
  validateOrThrow("render_graph.v1", renderGraph, "render_graph");
  validateOrThrow("datasource_contracts.v1", datasource, "datasource_contracts");
  validateOrThrow("workflow_dags.v1", workflows, "workflow_dags");
  validateOrThrow("checksums.v1", checksums, "checksums");
  validateOrThrow("platform_manifest.v1", manifest, "platform_manifest");

  return { ok: true, gate: "Schema Gate", details: "" };
}

export function collisionGate({ ssotDir, manifestsDir, releaseId }) {
  const pages = readJson(`${ssotDir}/studio/pages/page_definitions.json`);
  const routeCatalog = readJson(`${manifestsDir || "./runtime/manifests"}/route_catalog.${releaseId}.json`);
  const slugs = pages.map((p) => p.slug);
  const paths = routeCatalog.routes.map((r) => r.path);
  const ok = unique(slugs) && unique(paths);
  return { ok, gate: "Collision Gate", details: ok ? "" : "Duplicate slug or route path" };
}

export function orphanGate({ ssotDir, manifestsDir, releaseId }) {
  const pages = readJson(`${ssotDir}/studio/pages/page_definitions.json`);
  const routes = readJson(`${manifestsDir || "./runtime/manifests"}/route_catalog.${releaseId}.json`).routes;
  const pageVersions = readJson(`${ssotDir}/studio/pages/page_instances.json`);
  const widgets = readJson(`${ssotDir}/studio/widgets/widget_instances.json`);
  const pageIds = new Set(pages.map((p) => p.id));
  const orphanRoutes = routes.filter((r) => !pageIds.has(r.page_id));
  const referencedWidgets = new Set();
  for (const pv of pageVersions) {
    for (const wid of pv.widget_instance_ids || []) referencedWidgets.add(wid);
  }
  const orphanWidgets = widgets.filter((w) => !referencedWidgets.has(w.id));
  const ok = orphanRoutes.length === 0;
  const widgetOk = orphanWidgets.length === 0;
  const details = [];
  if (!ok) details.push(`Orphan routes: ${orphanRoutes.map((r) => r.route_id).join(", ")}`);
  if (!widgetOk) details.push(`Orphan widgets: ${orphanWidgets.map((w) => w.id).join(", ")}`);
  return { ok: ok && widgetOk, gate: "Orphan Gate", details: details.join(" | ") };
}

export function policyGate({ manifestsDir, releaseId }) {
  const routes = readJson(`${manifestsDir || "./runtime/manifests"}/route_catalog.${releaseId}.json`).routes;
  const missing = routes.filter((r) => !r.guard_pack_id || r.guard_pack_id === "");
  const ok = missing.length === 0;
  return { ok, gate: "Policy Gate", details: ok ? "" : `Routes without guard: ${missing.map((r) => r.route_id).join(", ")}` };
}

export function tokenGate({ ssotDir, releaseId, manifestsDir }) {
  const widgets = readJson(`${ssotDir}/studio/widgets/widget_instances.json`);
  const manifestRoot = manifestsDir || "./runtime/manifests";
  const themeManifest = readJson(`${manifestRoot}/theme_manifest.${releaseId}.json`);
  const offenders = widgets.filter((w) => {
    if (!w.props) return false;
    const keys = Object.keys(w.props);
    const hasInline = keys.some((k) => k.toLowerCase().includes("style") || k.toLowerCase().includes("class"));
    const hasHardcodedColor = Object.values(w.props).some((v) => typeof v === "string" && (v.includes("#") || v.includes("rgb(")));
    const hasPx = Object.values(w.props).some((v) => typeof v === "string" && v.includes("px"));
    return hasInline || hasHardcodedColor || hasPx;
  });
  const expectedCss = `:root{\n${(themeManifest.tokens || [])
    .map((t) => `--${t.token_key}: ${String(t.value)}${t.units || ""};`)
    .join("\n")}\n}`;
  const cssPath = manifestRoot.includes("/platform/runtime/manifests")
    ? `${manifestRoot.replace(/\/platform\/runtime\/manifests$/, "/platform/runtime/build_artifacts")}/theme_vars.${releaseId}.css`
    : manifestRoot.includes("/runtime/manifests")
      ? `${manifestRoot.replace(/\/runtime\/manifests$/, "/platform/runtime/build_artifacts")}/theme_vars.${releaseId}.css`
      : `${manifestRoot}/theme_vars.${releaseId}.css`;
  let cssOk = false;
  try {
    const css = readFileSync(cssPath, "utf-8");
    cssOk = css.trim() === expectedCss.trim();
  } catch {
    cssOk = false;
  }
  const ok = offenders.length === 0 && cssOk;
  const details = [];
  if (offenders.length) details.push(`Hardcoded styles in widgets: ${offenders.map((w) => w.id).join(", ")}`);
  if (!cssOk) details.push("Theme CSS vars artifact mismatch or missing");
  return { ok, gate: "Token Gate", details: details.join(" | ") };
}

export function reportPathGate() {
  const root = process.cwd();
  const entries = existsSync(root) ? readdirSync(root) : [];
  const forbidden = entries.filter((e) => e === "CI_REPORT.md" || e.endsWith(".log") || e.endsWith(".tmp"));
  const platformReports = join(root, "platform", "runtime", "reports");
  const platformHas = existsSync(platformReports) ? readdirSync(platformReports) : [];
  const ok = forbidden.length === 0 && platformHas.length === 0;
  const details = [];
  if (forbidden.length) details.push(`Forbidden root artifacts: ${forbidden.join(", ")}`);
  if (platformHas.length) details.push("Forbidden reports path: platform/runtime/reports");
  return { ok, gate: "Report Path Gate", details: details.join(" | ") };
}

export function coreChangeGate() {
  const changed = getChangedPaths();
  if (changed.length === 0) return { ok: true, gate: "Core Change Gate", details: "" };
  const violations = [];
  for (const p of changed) {
    const path = normalizePath(p);
    if (CORE_IGNORE_PATHS.includes(path)) continue;
    if (isRestrictedCorePath(path) && !isAllowedCorePath(path)) violations.push(path);
  }
  const ok = violations.length === 0;
  const details = ok
    ? ""
    : `Restricted core changes detected: ${violations.join(", ")} | Allowed: gates/docs/ssot modules/studio module authoring/scripts/maintenance`;
  return { ok, gate: "Core Change Gate", details };
}

export function scriptCatalogGate() {
  const catalogPath = "./scripts/maintenance/SCRIPT_CATALOG.json";
  if (!existsSync(catalogPath)) return { ok: false, gate: "Script Catalog Gate", details: "Missing SCRIPT_CATALOG.json" };
  const catalog = readJson(catalogPath);
  const ids = new Set();
  const paths = new Set();
  const norm = (p) => String(p).replace(/^\.\/?/, "");
  const duplicates = [];
  const badOutputs = [];
  const missingPaths = [];
  for (const entry of catalog) {
    if (ids.has(entry.id)) duplicates.push(`id:${entry.id}`);
    const entryPath = norm(entry.path);
    if (paths.has(entryPath)) duplicates.push(`path:${entry.path}`);
    ids.add(entry.id);
    paths.add(entryPath);
    if (entry.outputs) {
      for (const out of entry.outputs) {
        if (!String(out).includes("runtime/reports")) badOutputs.push(`${entry.id}:${out}`);
      }
    }
    if (entry.path && !existsSync(entry.path)) missingPaths.push(entry.path);
  }
  const scripts = [];
  for (const dir of ["./scripts/maintenance", "./scripts/ci"]) {
    for (const f of readdirSync(dir)) {
      if (f.startsWith(".") || f.endsWith(".md")) continue;
      scripts.push(norm(`${dir}/${f}`));
    }
  }
  const missing = scripts.filter((p) => !paths.has(p));
  const ok = duplicates.length === 0 && badOutputs.length === 0 && missing.length === 0 && missingPaths.length === 0;
  const details = [];
  if (duplicates.length) details.push(`Duplicates: ${duplicates.join(", ")}`);
  if (badOutputs.length) details.push(`Bad outputs: ${badOutputs.join(", ")}`);
  if (missingPaths.length) details.push(`Missing files: ${missingPaths.join(", ")}`);
  if (missing.length) details.push(`Unlisted scripts: ${missing.join(", ")}`);
  return { ok, gate: "Script Catalog Gate", details: details.join(" | ") };
}

export function artifactBudgetGate() {
  const previewDir = process.env.ARTIFACT_PREVIEW_DIR || join(process.cwd(), "platform", "runtime", "preview");
  const snapDir = process.env.ARTIFACT_SNAPSHOT_DIR || join(process.cwd(), "platform", "ssot", "changes", "snapshots");
  const previewCount = existsSync(previewDir)
    ? readdirSync(previewDir, { withFileTypes: true }).filter((e) => e.isDirectory()).length
    : 0;
  const snapCount = existsSync(snapDir)
    ? readdirSync(snapDir, { withFileTypes: true }).filter((e) => e.isDirectory()).length
    : 0;
  const ok = previewCount <= ARTIFACT_PREVIEW_MAX && snapCount <= ARTIFACT_SNAP_MAX;
  const details = ok
    ? ""
    : `preview_dirs=${previewCount} (max ${ARTIFACT_PREVIEW_MAX}) | snapshot_dirs=${snapCount} (max ${ARTIFACT_SNAP_MAX}) | ` +
      "Prune: CAP_ONLY=1 KEEP_PREVIEW_COUNT=50 KEEP_SNAP_COUNT=150 APPLY=1 scripts/maintenance/deep-clean-v5.sh";
  return { ok, gate: "Artifact Budget Gate", details };
}

export function accessGate({ ssotDir }) {
  const pages = readJson(`${ssotDir}/studio/pages/page_definitions.json`);
  const capabilities = new Set(readJson(`${ssotDir}/registry/capabilities.json`));
  const missing = [];
  for (const p of pages) {
    if (!p.capabilities_required || p.capabilities_required.length === 0) {
      missing.push(`${p.id}:missing_capabilities`);
    } else {
      for (const cap of p.capabilities_required || []) {
        if (!capabilities.has(cap)) missing.push(`${p.id}:${cap}`);
      }
    }
  }
  const ok = missing.length === 0;
  return { ok, gate: "Access Gate", details: ok ? "" : `Missing capabilities: ${missing.join(", ")}` };
}

export function quotaGate({ ssotDir }) {
  const planVersions = readJson(`${ssotDir}/tenancy/plan_versions.json`);
  const bad = [];
  const byPlan = new Map();
  for (const pv of planVersions) {
    if (!pv.rate_limits || !pv.compute_budgets || !pv.storage_quotas || !pv.ocr_quotas || !pv.workflow_quotas || !pv.budgets) {
      bad.push(`${pv.plan_id}@${pv.version}:missing_fields`);
    }
    if (pv.compute_budgets?.cpu_ms_per_day <= 0) bad.push(`${pv.plan_id}@${pv.version}:cpu_ms_per_day`);
    if (pv.rate_limits?.rps < 0 || pv.rate_limits?.burst < 0 || pv.rate_limits?.concurrent_ops < 0) bad.push(`${pv.plan_id}@${pv.version}:rate_limits`);
    if (pv.budgets?.cost_units_per_day < 0) bad.push(`${pv.plan_id}@${pv.version}:cost_units_per_day`);
    if (!byPlan.has(pv.plan_id)) byPlan.set(pv.plan_id, []);
    byPlan.get(pv.plan_id).push(pv);
  }

  for (const [planId, versions] of byPlan.entries()) {
    const sorted = versions.slice().sort((a, b) => compareSemver(parseSemver(a.version), parseSemver(b.version)));
    let prev = null;
    for (const v of sorted) {
      if (prev && parseSemver(prev.version).maj === parseSemver(v.version).maj) {
        const fields = [
          ["rps", v.rate_limits?.rps, prev.rate_limits?.rps],
          ["burst", v.rate_limits?.burst, prev.rate_limits?.burst],
          ["concurrent_ops", v.rate_limits?.concurrent_ops, prev.rate_limits?.concurrent_ops],
          ["cpu_ms_per_day", v.compute_budgets?.cpu_ms_per_day, prev.compute_budgets?.cpu_ms_per_day],
          ["cost_units_per_day", v.budgets?.cost_units_per_day, prev.budgets?.cost_units_per_day]
        ];
        for (const [k, val, prior] of fields) {
          if (typeof prior === "number" && typeof val === "number" && val < prior) bad.push(`${planId}:${k}:${prev.version}->${v.version}`);
        }
      }
      prev = v;
    }
  }

  const ok = bad.length === 0;
  return { ok, gate: "Quota Gate", details: ok ? "" : `Invalid quotas: ${bad.join(", ")}` };
}

export function planIntegrityGate({ ssotDir }) {
  const plans = readJson(`${ssotDir}/tenancy/plans.json`);
  const tenants = readJson(`${ssotDir}/tenancy/tenants.json`);
  const overrides = readJson(`${ssotDir}/tenancy/tenant_overrides.json`);
  const tenantQuotas = readJson(`${ssotDir}/tenancy/tenant_quotas.json`);
  const planIds = new Set(plans.map((p) => p.plan_id));
  const defaultPlan = plans.find((p) => p.is_default);

  const invalid = [];
  for (const t of tenants) {
    const override = overrides.find((o) => o.tenant_id === t.tenant_id);
    const planId = override?.plan_id || t.plan_id || defaultPlan?.plan_id;
    if (!planId || !planIds.has(planId)) invalid.push(`${t.tenant_id}:missing_plan`);
  }
  for (const o of overrides) {
    if (!planIds.has(o.plan_id)) invalid.push(`${o.tenant_id}:override_plan_missing`);
  }
  for (const q of tenantQuotas) {
    const planId = overrides.find((o) => o.tenant_id === q.tenant_id)?.plan_id || tenants.find((t) => t.tenant_id === q.tenant_id)?.plan_id || defaultPlan?.plan_id;
    const plan = plans.find((p) => p.plan_id === planId);
    const ceiling = plan?.hard_quota_ceiling || {};
    for (const [k, v] of Object.entries(q.quotas || {})) {
      if (typeof ceiling[k] === "number" && v > ceiling[k]) invalid.push(`${q.tenant_id}:${k}:exceeds_ceiling`);
    }
  }

  const ok = invalid.length === 0;
  return { ok, gate: "Plan Integrity Gate", details: ok ? "" : `Invalid plans: ${invalid.join(", ")}` };
}

export function qosConfigGate({ ssotDir }) {
  const planVersions = readJson(`${ssotDir}/tenancy/plan_versions.json`);
  const tiers = { free: null, pro: null, enterprise: null };
  for (const pv of planVersions) {
    if (tiers[pv.perf_tier] && tiers[pv.perf_tier].version === pv.version) continue;
    if (pv.status === "active") tiers[pv.perf_tier] = pv;
  }
  const missing = Object.entries(tiers).filter(([, v]) => !v).map(([k]) => k);
  const bad = [];
  if (missing.length) bad.push(`missing_tiers:${missing.join(",")}`);
  const free = tiers.free;
  const pro = tiers.pro;
  const ent = tiers.enterprise;
  if (free && pro && !(free.priority_weight < pro.priority_weight)) bad.push("priority_weight_free_pro");
  if (pro && ent && !(pro.priority_weight < ent.priority_weight)) bad.push("priority_weight_pro_ent");
  if (free && pro && !(free.rate_limits.rps < pro.rate_limits.rps)) bad.push("rps_free_pro");
  if (pro && ent && !(pro.rate_limits.rps < ent.rate_limits.rps)) bad.push("rps_pro_ent");
  if (free && pro && !(free.rate_limits.concurrent_ops < pro.rate_limits.concurrent_ops)) bad.push("concurrency_free_pro");
  if (pro && ent && !(pro.rate_limits.concurrent_ops < ent.rate_limits.concurrent_ops)) bad.push("concurrency_pro_ent");
  const ok = bad.length === 0;
  return { ok, gate: "QoS Config Gate", details: ok ? "" : `Invalid QoS config: ${bad.join(", ")}` };
}

export function noisyNeighborGate({ ssotDir }) {
  const planVersions = readJson(`${ssotDir}/tenancy/plan_versions.json`);
  const free = planVersions.find((p) => p.perf_tier === "free" && p.status === "active");
  const pro = planVersions.find((p) => p.perf_tier === "pro" && p.status === "active");
  const ent = planVersions.find((p) => p.perf_tier === "enterprise" && p.status === "active");
  const bad = [];
  if (free && pro && (free.rate_limits.rps >= pro.rate_limits.rps || free.rate_limits.concurrent_ops >= pro.rate_limits.concurrent_ops)) {
    bad.push("free_vs_pro_limits");
  }
  if (pro && ent && (pro.rate_limits.rps >= ent.rate_limits.rps || pro.rate_limits.concurrent_ops >= ent.rate_limits.concurrent_ops)) {
    bad.push("pro_vs_ent_limits");
  }
  const ok = bad.length === 0;
  return { ok, gate: "Noisy Neighbor Gate", details: ok ? "" : `Limits not tiered: ${bad.join(", ")}` };
}

export function extensionPermissionGate({ ssotDir }) {
  const perms = readJson(`${ssotDir}/extensions/extension_permissions.json`);
  const bad = [];
  for (const p of perms) {
    const req = p.requested_capabilities || [];
    if (req.some((c) => !EXT_ALLOWED_CAPS.includes(c))) bad.push(p.extension_id);
  }
  const ok = bad.length === 0;
  return { ok, gate: "Extension Permission Gate", details: ok ? "" : `Forbidden capabilities: ${bad.join(", ")}` };
}

export function extensionIsolationGate({ ssotDir }) {
  const versions = readJson(`${ssotDir}/extensions/extension_versions.json`);
  const bad = [];
  for (const v of versions) {
    for (const h of v.hooks || []) {
      if (!EXT_ALLOWED_EVENTS.includes(h.event) || !EXT_ALLOWED_HANDLERS.includes(h.handler)) {
        bad.push(`${v.extension_id}@${v.version}`);
      }
    }
  }
  const ok = bad.length === 0;
  return { ok, gate: "Extension Isolation Gate", details: ok ? "" : `Invalid hooks: ${bad.join(", ")}` };
}

export function extensionReviewGate({ ssotDir }) {
  const versions = readJson(`${ssotDir}/extensions/extension_versions.json`);
  const installs = readJson(`${ssotDir}/extensions/extension_installations.json`);
  const reviews = readJson(`${ssotDir}/extensions/extension_reviews.json`);
  const bad = [];
  for (const v of versions.filter((x) => x.status === "released")) {
    const r = reviews.find((rv) => rv.target === "version" && rv.extension_id === v.extension_id && rv.version === v.version && rv.status === "approved");
    if (!r || (r.approvals || []).length < (r.required_approvals || 1)) bad.push(`${v.extension_id}@${v.version}:version`);
  }
  for (const i of installs) {
    const r = reviews.find((rv) => rv.target === "install" && rv.extension_id === i.extension_id && rv.version === i.version && rv.status === "approved");
    if (!r || (r.approvals || []).length < (r.required_approvals || 1)) bad.push(`${i.extension_id}@${i.version}:install`);
  }
  const ok = bad.length === 0;
  return { ok, gate: "Extension Review Gate", details: ok ? "" : `Missing reviews: ${bad.join(", ")}` };
}

export function extensionSignatureGate({ ssotDir, manifestsDir }) {
  const extensions = readJson(`${ssotDir}/extensions/extensions.json`);
  const versions = readJson(`${ssotDir}/extensions/extension_versions.json`).filter((v) => v.status === "released");
  const publishers = readJson(`${ssotDir}/extensions/publishers.json`);
  const base = manifestsDir || "./runtime/manifests";
  const stagedExtDir = `${base}/extensions`;
  const extDir = existsSync(stagedExtDir)
    ? stagedExtDir
    : base.includes("/runtime/manifests")
      ? base.replace(/\/runtime\/manifests$/, "/runtime/extensions")
      : `${base}/extensions`;
  const bad = [];
  for (const v of versions) {
    const artifactPath = `${extDir}/${v.extension_id.replace(/[:/]/g, "_")}@${v.version}.signed.json`;
    if (!existsSync(artifactPath)) {
      bad.push(`${v.extension_id}@${v.version}:missing`);
      continue;
    }
    const artifact = readJson(artifactPath);
    const payload = stableStringify({
      extension_id: artifact.extension_id,
      version: artifact.version,
      manifest_fragment_ref: artifact.manifest_fragment_ref,
      hooks: artifact.hooks || [],
      requested_capabilities: artifact.requested_capabilities || []
    });
    const checksum = `sha256:${sha256(payload)}`;
    if (artifact.checksum !== checksum) {
      bad.push(`${v.extension_id}@${v.version}:checksum`);
      continue;
    }
    if (!artifact.signature) {
      bad.push(`${v.extension_id}@${v.version}:signature_missing`);
      continue;
    }
    const publisherId = extensions.find((e) => e.id === v.extension_id)?.publisher;
    const pub = publishers.find((p) => p.publisher_id === publisherId);
    const pubKey = pub?.public_key || "";
    if (pubKey) {
      const ok = verifyPayload(payload, artifact.signature, pubKey);
      if (!ok) bad.push(`${v.extension_id}@${v.version}:signature`);
    }
  }
  const ok = bad.length === 0;
  return { ok, gate: "Extension Signature Gate", details: ok ? "" : `Invalid artifacts: ${bad.join(", ")}` };
}

export function dataCatalogGate({ ssotDir }) {
  const models = readJson(`${ssotDir}/data/catalog/data_models.json`);
  const modelVersions = readJson(`${ssotDir}/data/catalog/data_model_versions.json`);
  const fields = readJson(`${ssotDir}/data/catalog/data_fields.json`);
  const classifications = new Set(readJson(`${ssotDir}/data/catalog/data_classifications.json`).map((c) => c.classification_id));
  const fieldIds = new Set(fields.map((f) => f.field_id));
  const bad = [];
  for (const mv of modelVersions) {
    for (const f of mv.fields || []) {
      if (!fieldIds.has(f)) bad.push(`${mv.data_model_id}:${f}`);
    }
  }
  for (const f of fields) {
    if (!classifications.has(f.classification_id)) bad.push(`${f.field_id}:missing_classification`);
  }
  const ok = bad.length === 0 && models.length > 0;
  return { ok, gate: "Data Catalog Gate", details: ok ? "" : `Invalid catalog: ${bad.join(", ")}` };
}

export function retentionPolicyGate({ ssotDir }) {
  const fields = readJson(`${ssotDir}/data/catalog/data_fields.json`);
  const policies = readJson(`${ssotDir}/data/policies/retention_policies.json`);
  const sensitive = new Set(fields.filter((f) => ["pii.high", "secrets", "financial"].includes(f.classification_id)).map((f) => f.data_model_id));
  const bad = [];
  for (const modelId of sensitive) {
    const p = policies.find((x) => x.target_model_id === modelId);
    if (!p || p.retain_days === undefined) bad.push(`${modelId}:missing_retention`);
    if (p && p.legal_hold && (p.purge_strategy === "delete" || p.purge_strategy === "anonymize")) bad.push(`${modelId}:legal_hold_purge`);
  }
  const ok = bad.length === 0;
  return { ok, gate: "Retention Policy Gate", details: ok ? "" : `Invalid retention: ${bad.join(", ")}` };
}

export function exportControlGate({ ssotDir }) {
  const controls = readJson(`${ssotDir}/data/policies/export_controls.json`);
  const bad = [];
  for (const c of controls) {
    if (c.export_type === "dataset" && !c.requires_quorum) bad.push(`${c.control_id}:dataset_requires_quorum`);
    if (c.export_type && c.masking_required !== true && c.export_type === "dataset") bad.push(`${c.control_id}:masking_required`);
  }
  const ok = bad.length === 0;
  return { ok, gate: "Export Control Gate", details: ok ? "" : `Invalid export controls: ${bad.join(", ")}` };
}

export function connectorConfigGate({ ssotDir }) {
  const connectors = readJson(`${ssotDir}/integrations/connectors.json`);
  const versions = readJson(`${ssotDir}/integrations/connector_versions.json`);
  const configs = readJson(`${ssotDir}/integrations/connector_configs.json`);
  const connectorIds = new Set(connectors.map((c) => c.connector_id));
  const versionKeys = new Set(versions.map((v) => `${v.connector_id}@${v.version}`));
  const bad = [];
  for (const v of versions.filter((x) => x.status === "released")) {
    if (!v.signature || !v.checksum) bad.push(`${v.connector_id}@${v.version}:missing_signature`);
  }
  for (const cfg of configs) {
    if (!connectorIds.has(cfg.connector_id)) bad.push(`${cfg.config_id}:missing_connector`);
    if (!versionKeys.has(`${cfg.connector_id}@${cfg.version}`)) bad.push(`${cfg.config_id}:missing_version`);
  }
  const ok = bad.length === 0;
  return { ok, gate: "Connector Config Gate", details: ok ? "" : `Invalid configs: ${bad.join(", ")}` };
}

export function webhookSecurityGate({ ssotDir }) {
  const webhooks = readJson(`${ssotDir}/integrations/webhooks.json`);
  const bad = [];
  for (const w of webhooks) {
    if (w.direction === "inbound") {
      if (!w.signature_required) bad.push(`${w.webhook_id}:signature_required`);
      if (!w.secret_ref_id) bad.push(`${w.webhook_id}:secret_ref_id_missing`);
    }
  }
  const ok = bad.length === 0;
  return { ok, gate: "Webhook Security Gate", details: ok ? "" : `Invalid webhooks: ${bad.join(", ")}` };
}

export function webhookNoWeakSigGate({ ssotDir }) {
  const webhooks = readJson(`${ssotDir}/integrations/webhooks.json`);
  const bad = [];
  for (const w of webhooks) {
    if (w.direction === "inbound") {
      if (!w.signature_required) bad.push(`${w.webhook_id}:signature_required`);
      const header = w.signature_header || "";
      if (!header) bad.push(`${w.webhook_id}:signature_header_missing`);
      if (header && !String(header).toLowerCase().includes("signature")) bad.push(`${w.webhook_id}:signature_header_weak`);
    }
  }
  const ok = bad.length === 0;
  return { ok, gate: "Webhook No Weak Sig Gate", details: ok ? "" : `Invalid signature headers: ${bad.join(", ")}` };
}

export function secretRefGate({ ssotDir }) {
  const refs = readJson(`${ssotDir}/integrations/secrets_vault_refs.json`);
  const configs = readJson(`${ssotDir}/integrations/connector_configs.json`);
  const webhooks = readJson(`${ssotDir}/integrations/webhooks.json`);
  const refIds = new Set(refs.map((r) => r.ref_id));
  const bad = [];

  function scan(obj, path = "") {
    if (!obj || typeof obj !== "object") return;
    for (const [k, v] of Object.entries(obj)) {
      const key = String(k).toLowerCase();
      if (SECRET_KEYS.some((s) => key.includes(s)) && !key.includes("ref")) {
        if (typeof v === "string" && v.trim().length > 0) bad.push(`${path}${k}:plaintext`);
      }
      if (v && typeof v === "object") scan(v, `${path}${k}.`);
    }
  }

  for (const cfg of configs) {
    if (cfg.secret_ref_id && !refIds.has(cfg.secret_ref_id)) bad.push(`${cfg.config_id}:secret_ref_missing`);
    scan(cfg, `connector_config:${cfg.config_id}.`);
  }
  for (const w of webhooks) {
    if (w.secret_ref_id && !refIds.has(w.secret_ref_id)) bad.push(`${w.webhook_id}:secret_ref_missing`);
    scan(w, `webhook:${w.webhook_id}.`);
  }

  const ok = bad.length === 0;
  return { ok, gate: "Secret Ref Gate", details: ok ? "" : `Secrets violations: ${bad.join(", ")}` };
}

export function rotationIntegrityGate({ ssotDir }) {
  const bindings = readJson(`${ssotDir}/security/secret_bindings.json`);
  const policies = readJson(`${ssotDir}/security/secret_policies.json`);
  const refs = readJson(`${ssotDir}/security/secrets_vault_refs.json`);
  const refIds = new Set(refs.map((r) => r.id));
  const bad = [];
  const now = Date.now();
  for (const b of bindings) {
    const policy = policies.find((p) => p.id === b.policy_id);
    if (!policy) bad.push(`${b.id}:missing_policy`);
    if (!refIds.has(b.active_ref)) bad.push(`${b.id}:active_ref_missing`);
    if (b.expires_at) {
      const exp = Date.parse(b.expires_at);
      if (Number.isFinite(exp) && exp < now) bad.push(`${b.id}:active_ref_expired`);
    }
    if (b.usage === "webhook_signing" && b.next_ref && policy && policy.allow_dual !== true) {
      bad.push(`${b.id}:dual_not_allowed_for_webhook_signing`);
    }
  }
  const ok = bad.length === 0;
  return { ok, gate: "Rotation Integrity Gate", details: ok ? "" : bad.join(", ") };
}

export function s2sTransportGate({ ssotDir }) {
  if (process.env.S2S_REQUIRE_MTLS !== "1") {
    return { ok: true, gate: "S2S Transport Gate", details: "" };
  }
  const policies = readJson(`${ssotDir}/security/token_exchange_policies.json`);
  const ok = policies.some((p) => p.require_mtls === true);
  return {
    ok,
    gate: "S2S Transport Gate",
    details: ok ? "" : "S2S_REQUIRE_MTLS enabled but no policy require_mtls=true"
  };
}

export function replayProtectionGate({ ssotDir }) {
  const bindings = readJson(`${ssotDir}/security/secret_bindings.json`);
  const policies = readJson(`${ssotDir}/security/secret_policies.json`);
  const bad = [];
  for (const b of bindings) {
    if (b.usage !== "webhook_signing") continue;
    const policy = policies.find((p) => p.id === b.policy_id);
    if (!policy) bad.push(`${b.id}:missing_policy`);
    const windowMs = policy?.replay_window_ms || 0;
    if (windowMs <= 0) bad.push(`${b.id}:missing_replay_window`);
  }
  const ok = bad.length === 0;
  return { ok, gate: "Replay Protection Gate", details: ok ? "" : bad.join(", ") };
}

export function egressGovernanceGate({ ssotDir }) {
  const webhooks = readJson(`${ssotDir}/integrations/webhooks.json`);
  const controls = readJson(`${ssotDir}/data/policies/export_controls.json`);
  const controlTypes = new Set(controls.map((c) => c.export_type));
  const bad = [];
  for (const w of webhooks) {
    if (w.direction !== "outbound") continue;
    if (!w.export_type) bad.push(`${w.webhook_id}:missing_export_type`);
    if (w.export_type && !controlTypes.has(w.export_type)) bad.push(`${w.webhook_id}:missing_export_control`);
    if (!w.data_model_id) bad.push(`${w.webhook_id}:missing_data_model_id`);
  }
  const ok = bad.length === 0;
  return { ok, gate: "Egress Governance Gate", details: ok ? "" : `Invalid outbound webhooks: ${bad.join(", ")}` };
}

export function retryDlqGate({ ssotDir }) {
  const webhooks = readJson(`${ssotDir}/integrations/webhooks.json`);
  const bad = [];
  for (const w of webhooks) {
    if (w.direction !== "outbound") continue;
    if (!w.retry_policy || w.retry_policy.max_attempts === undefined) bad.push(`${w.webhook_id}:missing_retry_policy`);
    if (w.dlq_enabled !== true) bad.push(`${w.webhook_id}:dlq_disabled`);
  }
  const ok = bad.length === 0;
  return { ok, gate: "Retry DLQ Gate", details: ok ? "" : `Invalid retry/DLQ: ${bad.join(", ")}` };
}

export function sloGate({ ssotDir }) {
  const slos = readJson(`${ssotDir}/sre/slo_definitions.json`);
  const budgets = readJson(`${ssotDir}/sre/error_budget_policies.json`);
  const bad = [];
  for (const slo of slos) {
    if (slo.slo_id.includes("latency") || slo.tier_targets) {
      const t = slo.tier_targets || {};
      if (!(t.free && t.pro && t.enterprise)) bad.push(`${slo.slo_id}:missing_tier_targets`);
    }
    const policy = budgets.find((b) => b.slo_id === slo.slo_id);
    if (!policy) bad.push(`${slo.slo_id}:missing_budget_policy`);
    if (slo.critical && policy && !(policy.actions || []).some((a) => a.includes("rollback"))) {
      bad.push(`${slo.slo_id}:missing_rollback_action`);
    }
  }
  const ok = bad.length === 0 && slos.length > 0;
  return { ok, gate: "SLO Gate", details: ok ? "" : `Invalid SLO config: ${bad.join(", ")}` };
}

export function canaryGate({ ssotDir }) {
  const policies = readJson(`${ssotDir}/sre/canary_policies.json`);
  const bad = [];
  if (!policies.length) bad.push("missing_canary_policy");
  for (const p of policies) {
    if (!p.window_minutes || p.window_minutes <= 0) bad.push(`${p.policy_id}:window`);
  }
  const ok = bad.length === 0;
  return { ok, gate: "Canary Gate", details: ok ? "" : `Invalid canary policies: ${bad.join(", ")}` };
}

export function drillGate() {
  const hasRestore = existsSync("./scripts/maintenance/restore-drill.mjs");
  const hasEvidence = existsSync("./scripts/maintenance/generate-evidence-pack.mjs");
  const ok = hasRestore && hasEvidence;
  return { ok, gate: "Drill Gate", details: ok ? "" : "Missing restore-drill or evidence pack script" };
}

export function chaosGate() {
  const hasChaos = existsSync("./scripts/chaos/chaos-run.mjs");
  const hasFaults = existsSync("./scripts/chaos/faults") && readdirSync("./scripts/chaos/faults").some((f) => f.endsWith(".mjs"));
  const ok = hasChaos && hasFaults;
  return { ok, gate: "Chaos Gate", details: ok ? "" : "Chaos toolkit missing" };
}

export function perfBudgetGate({ ssotDir }) {
  const queries = readJson(`${ssotDir}/data/query_catalog.json`);
  const budgets = readJson(`${ssotDir}/data/query_budgets.json`);
  const budgetIds = new Set(budgets.map((b) => b.query_id));
  const missing = queries.filter((q) => !budgetIds.has(q.query_id));
  const ok = missing.length === 0;
  return { ok, gate: "Perf Budget Gate", details: ok ? "" : `Missing budgets for: ${missing.map((q) => q.query_id).join(", ")}` };
}

export function isolationGate({ ssotDir, manifestsDir, releaseId }) {
  const pages = readJson(`${ssotDir}/studio/pages/page_definitions.json`);
  const routes = readJson(`${manifestsDir || "./runtime/manifests"}/route_catalog.${releaseId}.json`).routes;
  const pageById = new Map(pages.map((p) => [p.id, p]));
  const violations = routes.filter((r) => pageById.get(r.page_id)?.surface !== r.surface);
  const ok = violations.length === 0;
  return { ok, gate: "Isolation Gate", details: ok ? "" : `Surface mismatch: ${violations.map((r) => r.route_id).join(", ")}` };
}

export function driftGate({ manifestsDir, releaseId }) {
  const manifest = readJson(`${manifestsDir || "./runtime/manifests"}/platform_manifest.${releaseId}.json`);
  const checksums = manifest.checksums || {};
  const manifestChecksum = sha256(stableStringify({ ...manifest, signature: "", checksums: { ...checksums, manifest: "" } }));
  const ok = checksums.manifest === manifestChecksum;
  return { ok, gate: "Drift Gate", details: ok ? "" : "Manifest checksum mismatch" };
}

export function noFallbackGate() {
  const cpApp = readFileSync("./apps/control-plane/public/app.js", "utf-8");
  const clientApp = readFileSync("./apps/client-app/public/app.js", "utf-8");
  const mustHave = ["manifest?.routes?.routes"];
  const forbidden = [/staticRoutes/i, /fallbackRoutes/i, /hardcodedRoutes/i, /nav\s*=\s*\[/i, /routes\s*=\s*\[/i];

  const missing = mustHave.filter((m) => !cpApp.includes(m) || !clientApp.includes(m));
  const offenders = [];
  for (const re of forbidden) {
    if (re.test(cpApp) || re.test(clientApp)) offenders.push(re.toString());
  }

  const ok = missing.length === 0 && offenders.length === 0;
  const details = [];
  if (missing.length) details.push("Missing manifest route usage");
  if (offenders.length) details.push(`Forbidden patterns: ${offenders.join(", ")}`);
  return { ok, gate: "NoFallback Gate", details: details.join(" | ") };
}

export function governanceGate({ ssotDir }) {
  const policies = readJson(`${ssotDir}/governance/policies.json`);
  const bindings = readJson(`${ssotDir}/governance/policy_bindings.json`);
  const breakGlass = readJson(`${ssotDir}/governance/break_glass.json`);
  const critical = ["studio.releases.publish", "studio.releases.activate", "studio.releases.rollback", "studio.delete", "breakglass.request", "breakglass.approve", "breakglass.disable"];
  const policyIds = new Set(bindings.filter((b) => b.scope === "platform:*").map((b) => b.policy_id));
  const missing = [];
  for (const action of critical) {
    const ok = policies.some((p) => policyIds.has(p.id) && (p.actions || []).includes(action));
    if (!ok) missing.push(action);
  }
  const bgOk = !breakGlass.enabled || (breakGlass.expires_at && (breakGlass.allowed_actions || []).length > 0);
  const ok = missing.length === 0 && bgOk;
  const details = [];
  if (missing.length) details.push(`Missing platform policy for: ${missing.join(", ")}`);
  if (!bgOk) details.push("Break-glass invalid (expires_at or allowlist missing)");
  return { ok, gate: "Governance Gate", details: details.join(" | ") };
}

export function freezeGate({ ssotDir }) {
  const freeze = readJsonIfExists(`${ssotDir}/governance/change_freeze.json`);
  if (!freeze?.enabled) return { ok: true, gate: "Freeze Gate", details: "" };
  const dir = `${ssotDir}/changes/changesets`;
  if (!existsSync(dir)) return { ok: true, gate: "Freeze Gate", details: "" };
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  const freezeAt = Date.parse(freeze.enabled_at || "");
  const contentBlocked = new Set([
    "page_definition",
    "page_version",
    "route_spec",
    "nav_spec",
    "widget_instance",
    "form_schema",
    "workflow_definition",
    "design_token",
    "theme"
  ]);
  const moduleKinds = new Set([
    "domain_module",
    "domain_module_version",
    "module_activation"
  ]);
  const offenders = [];
  const scopes = freeze.scopes || {};
  const pages = readJson(`${ssotDir}/studio/pages/page_definitions.json`);
  const pagesById = new Map(pages.map((p) => [p.id, p]));
  const routes = readJson(`${ssotDir}/studio/routes/route_specs.json`);
  const routesById = new Map(routes.map((r) => [r.route_id, r]));
  const nav = readJson(`${ssotDir}/studio/nav/nav_specs.json`);
  const navById = new Map(nav.map((n) => [n.id, n]));
  for (const f of files) {
    const cs = readJson(`${dir}/${f}`);
    if (cs.status !== "draft" && cs.status !== "pending") continue;
    if (Number.isFinite(freezeAt)) {
      const createdAt = Date.parse(cs.created_at || "");
      if (Number.isFinite(createdAt) && createdAt < freezeAt) continue;
    }
    for (const op of cs.ops || []) {
      const kind = op?.target?.kind || "";
      const isContent = contentBlocked.has(kind);
      const isModule = moduleKinds.has(kind);
      let isStudioUi = false;
      if (kind === "page_definition") {
        const v = op.value || pagesById.get(op.target.ref);
        if (v?.surface === "cp" || v?.module_id === "studio") isStudioUi = true;
      }
      if (kind === "page_version") {
        const pv = op.value || null;
        const pid = pv?.page_id || op.target.ref;
        const page = pagesById.get(pid);
        if (page?.surface === "cp" || page?.module_id === "studio") isStudioUi = true;
      }
      if (kind === "route_spec") {
        const r = op.value || routesById.get(op.target.ref);
        if (r?.surface === "cp") isStudioUi = true;
      }
      if (kind === "nav_spec") {
        const n = op.value || navById.get(op.target.ref);
        if (n?.surface === "cp") isStudioUi = true;
      }

      if (isModule && scopes.studio_ui_mutations === true) offenders.push(`${cs.id}:${kind}`);
      if (isContent && scopes.content_mutations === true && !isStudioUi) offenders.push(`${cs.id}:${kind}`);
      if (isContent && isStudioUi && scopes.studio_ui_mutations === true) offenders.push(`${cs.id}:${kind}`);
    }
  }
  const ok = offenders.length === 0;
  return { ok, gate: "Freeze Gate", details: ok ? "" : `Frozen changes present: ${offenders.join(", ")}` };
}

export function freezeScopeGate({ ssotDir }) {
  const freeze = readJsonIfExists(`${ssotDir}/governance/change_freeze.json`);
  if (!freeze?.enabled) return { ok: true, gate: "Freeze Scope Gate", details: "" };
  const scopes = freeze.scopes || {};
  if (scopes.studio_ui_mutations !== false) return { ok: true, gate: "Freeze Scope Gate", details: "" };
  const dir = `${ssotDir}/changes/reviews`;
  if (!existsSync(dir)) return { ok: false, gate: "Freeze Scope Gate", details: "Missing quorum review for studio_ui_mutations" };
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  const reviews = files.map((f) => readJson(`${dir}/${f}`));
  const approved = reviews.find((r) => r.action === "freeze.scope" && r.target_id === "change_freeze" && r.status === "approved");
  const ok = Boolean(approved);
  return { ok, gate: "Freeze Scope Gate", details: ok ? "" : "studio_ui_mutations enabled without quorum" };
}

export function quorumGate({ ssotDir }) {
  const dir = `${ssotDir}/changes/reviews`;
  if (!existsSync(dir)) return { ok: true, gate: "Quorum Gate", details: "" };
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  const bad = [];
  for (const f of files) {
    const r = readJson(`${dir}/${f}`);
    if (!r.action) continue;
    const required = r.required_approvals || 0;
    const approvals = (r.approvals || []).length;
    if (required > approvals || r.status !== "approved") bad.push(f);
  }
  const ok = bad.length === 0;
  return { ok, gate: "Quorum Gate", details: ok ? "" : `Unapproved reviews: ${bad.join(", ")}` };
}

export function opsPolicyGate({ ssotDir }) {
  const severities = readJson(`${ssotDir}/ops/incident_severities.json`);
  const policies = readJson(`${ssotDir}/ops/mitigation_policies.json`);
  const missing = severities.filter((s) => !policies.some((p) => p.severity_id === s.severity_id));
  const critical = ["release.rollback", "change.freeze", "extension.killswitch", "open.break_glass"];
  const bad = [];
  for (const p of policies) {
    for (const action of p.allowed_actions || []) {
      if (critical.includes(action) && !(p.require_quorum_actions || []).includes(action)) {
        bad.push(`${p.policy_id}:${action}`);
      }
    }
  }
  const ok = missing.length === 0 && bad.length === 0;
  const details = [];
  if (missing.length) details.push(`Missing mitigation policies for: ${missing.map((m) => m.severity_id).join(", ")}`);
  if (bad.length) details.push(`Critical actions missing quorum: ${bad.join(", ")}`);
  return { ok, gate: "Ops Policy Gate", details: details.join(" | ") };
}

export function domainIsolationGate({ ssotDir }) {
  const modules = readJson(`${ssotDir}/modules/domain_modules.json`);
  const pages = readJson(`${ssotDir}/studio/pages/page_definitions.json`);
  const routes = readJson(`${ssotDir}/studio/routes/route_specs.json`);
  const nav = readJson(`${ssotDir}/studio/nav/nav_specs.json`);
  const widgets = readJson(`${ssotDir}/studio/widgets/widget_catalog.json`);
  const forms = readJson(`${ssotDir}/studio/forms/form_schemas.json`);
  const workflows = readJson(`${ssotDir}/studio/workflows/workflow_definitions.json`);
  const queries = readJson(`${ssotDir}/data/query_catalog.json`);

  const pagesById = new Map(pages.map((p) => [p.id, p]));
  const routesById = new Map(routes.map((r) => [r.route_id, r]));
  const navById = new Map(nav.map((n) => [n.id, n]));
  const widgetsById = new Map(widgets.map((w) => [w.id, w]));
  const formsById = new Map(forms.map((f) => [f.form_id, f]));
  const workflowsById = new Map(workflows.map((w) => [w.workflow_id, w]));
  const queriesById = new Map(queries.map((q) => [q.query_id, q]));

  const bad = [];
  for (const mod of modules) {
    const mid = mod.module_id;
    for (const pid of mod.provides.pages || []) {
      const p = pagesById.get(pid);
      if (!p || p.module_id !== mid) bad.push(`${mid}:page:${pid}`);
    }
    for (const rid of mod.provides.routes || []) {
      const r = routesById.get(rid);
      const p = r ? pagesById.get(r.page_id) : null;
      if (!r || !p || p.module_id !== mid) bad.push(`${mid}:route:${rid}`);
    }
    for (const nid of mod.provides.nav || []) {
      const n = navById.get(nid);
      if (!n || n.module_id !== mid) bad.push(`${mid}:nav:${nid}`);
    }
    for (const wid of mod.provides.widgets || []) {
      if (!widgetsById.has(wid)) bad.push(`${mid}:widget:${wid}`);
    }
    for (const fid of mod.provides.forms || []) {
      const f = formsById.get(fid);
      if (!f || f.module_id !== mid) bad.push(`${mid}:form:${fid}`);
    }
    for (const wid of mod.provides.workflows || []) {
      const w = workflowsById.get(wid);
      if (!w || w.module_id !== mid) bad.push(`${mid}:workflow:${wid}`);
    }
    for (const qid of mod.provides.datasources || []) {
      const q = queriesById.get(qid);
      if (!q || q.module_id !== mid) bad.push(`${mid}:datasource:${qid}`);
    }
  }
  const ok = bad.length === 0;
  return { ok, gate: "Domain Isolation Gate", details: ok ? "" : `Invalid refs: ${bad.join(", ")}` };
}

export function moduleActivationGate({ ssotDir, manifestsDir, releaseId }) {
  const modules = readJson(`${ssotDir}/modules/domain_modules.json`);
  const moduleIds = new Set(modules.map((m) => m.module_id));
  const moduleActivations = readJson(`${ssotDir}/modules/module_activations.json`);
  const activeModuleIds = new Set(moduleActivations.filter((m) => m.state === "active").map((m) => m.module_id));
  const pages = readJson(`${ssotDir}/studio/pages/page_definitions.json`);
  const pagesById = new Map(pages.map((p) => [p.id, p]));
  const manifest = readJson(`${manifestsDir || "./runtime/manifests"}/platform_manifest.${releaseId}.json`);
  const routeCatalog = manifest.routes || { routes: [] };
  const navManifest = manifest.nav || { nav_specs: [] };

  const badRoutes = routeCatalog.routes.filter((r) => {
    const p = pagesById.get(r.page_id);
    return p?.module_id && moduleIds.has(p.module_id) && !activeModuleIds.has(p.module_id);
  });
  const badNav = (navManifest.nav_specs || []).filter((n) => n.module_id && moduleIds.has(n.module_id) && !activeModuleIds.has(n.module_id));
  const ok = badRoutes.length === 0 && badNav.length === 0;
  const details = [];
  if (badRoutes.length) details.push(`Inactive module routes present: ${badRoutes.map((r) => r.route_id).join(", ")}`);
  if (badNav.length) details.push(`Inactive module nav present: ${badNav.map((n) => n.id).join(", ")}`);
  return { ok, gate: "Module Activation Gate", details: details.join(" | ") };
}

export function modulePageOwnershipGate({ ssotDir }) {
  const pages = readJson(`${ssotDir}/studio/pages/page_definitions.json`);
  const pageVersions = readJson(`${ssotDir}/studio/pages/page_instances.json`);
  const routes = readJson(`${ssotDir}/studio/routes/route_specs.json`);
  const pagesById = new Map(pages.map((p) => [p.id, p]));
  const bad = [];

  for (const p of pages) {
    if (!p.module_id) bad.push(`${p.id}:missing_module_id`);
  }
  for (const pv of pageVersions) {
    if (!pv.module_id) bad.push(`${pv.page_id}:missing_module_id`);
    const def = pagesById.get(pv.page_id);
    if (def && pv.module_id && def.module_id !== pv.module_id) {
      bad.push(`${pv.page_id}:module_mismatch`);
    }
  }
  for (const r of routes) {
    const def = pagesById.get(r.page_id);
    if (!def || !def.module_id) bad.push(`${r.route_id}:page_module_missing`);
  }

  const ok = bad.length === 0;
  return { ok, gate: "Module Page Ownership Gate", details: ok ? "" : bad.join(", ") };
}

export function widgetBindingGate({ ssotDir }) {
  const widgets = readJson(`${ssotDir}/studio/widgets/widget_instances.json`);
  const catalog = readJson(`${ssotDir}/studio/widgets/widget_catalog.json`);
  const pageVersions = readJson(`${ssotDir}/studio/pages/page_instances.json`);
  const catalogById = new Map(catalog.map((w) => [w.id, w]));

  const counts = new Map();
  for (const pv of pageVersions) {
    for (const wid of pv.widget_instance_ids || []) {
      counts.set(wid, (counts.get(wid) || 0) + 1);
    }
  }

  const bad = [];
  for (const w of widgets) {
    if (!w.page_id) bad.push(`${w.id}:missing_page_id`);
    if (!w.module_id) bad.push(`${w.id}:missing_module_id`);
    const usage = counts.get(w.id) || 0;
    const cat = catalogById.get(w.widget_id) || {};
    if (cat.reusable) {
      if (!cat.capability_required) bad.push(`${w.id}:reusable_missing_capability`);
      if (!w.props_schema_version) bad.push(`${w.id}:reusable_missing_props_schema_version`);
    } else if (usage !== 1) {
      bad.push(`${w.id}:usage_count:${usage}`);
    }
  }
  const ok = bad.length === 0;
  return { ok, gate: "Widget Binding Gate", details: ok ? "" : bad.join(", ") };
}

export function sectionNoRouteGate({ ssotDir }) {
  const navSpecs = readJson(`${ssotDir}/studio/nav/nav_specs.json`);
  const routes = readJson(`${ssotDir}/studio/routes/route_specs.json`);
  const routesByPage = new Map();
  for (const r of routes) {
    const list = routesByPage.get(r.page_id) || [];
    list.push(r.path);
    routesByPage.set(r.page_id, list);
  }
  const bad = [];
  for (const n of navSpecs) {
    if (n.type !== "section") continue;
    if (n.path) bad.push(`${n.id}:section_has_path`);
    const paths = routesByPage.get(n.page_id) || [];
    for (const p of paths) {
      if (p.endsWith(`/${n.section_key}`)) bad.push(`${n.id}:section_route:${p}`);
    }
  }
  const ok = bad.length === 0;
  return { ok, gate: "Section No Route Gate", details: ok ? "" : bad.join(", ") };
}

export function dataGovCoverageGate({ ssotDir }) {
  const modules = readJson(`${ssotDir}/modules/domain_modules.json`);
  const queries = readJson(`${ssotDir}/data/query_catalog.json`);
  const fields = readJson(`${ssotDir}/data/catalog/data_fields.json`);
  const classifications = new Set(readJson(`${ssotDir}/data/catalog/data_classifications.json`).map((c) => c.classification_id));
  const retention = readJson(`${ssotDir}/data/policies/retention_policies.json`);
  const retentionByModel = new Set(retention.map((r) => r.target_model_id));

  const queriesById = new Map(queries.map((q) => [q.query_id, q]));
  const fieldsByModel = new Map();
  for (const f of fields) {
    const list = fieldsByModel.get(f.data_model_id) || [];
    list.push(f);
    fieldsByModel.set(f.data_model_id, list);
  }

  const bad = [];
  for (const mod of modules) {
    for (const qid of mod.provides.datasources || []) {
      const q = queriesById.get(qid);
      if (!q) continue;
      const f = fieldsByModel.get(q.data_model_id) || [];
      if (f.length === 0) bad.push(`${mod.module_id}:${q.data_model_id}:no_fields`);
      if (!retentionByModel.has(q.data_model_id)) bad.push(`${mod.module_id}:${q.data_model_id}:missing_retention`);
      for (const field of f) {
        if (!field.classification_id || !classifications.has(field.classification_id)) {
          bad.push(`${mod.module_id}:${field.field_id}:missing_classification`);
        }
      }
    }
  }
  const ok = bad.length === 0;
  return { ok, gate: "DataGov Coverage Gate", details: ok ? "" : bad.join(", ") };
}

export function budgetCoverageGate({ ssotDir }) {
  const modules = readJson(`${ssotDir}/modules/domain_modules.json`);
  const queries = readJson(`${ssotDir}/data/query_catalog.json`);
  const budgets = readJson(`${ssotDir}/data/query_budgets.json`);
  const planVersions = readJson(`${ssotDir}/tenancy/plan_versions.json`);
  const tiers = new Set(planVersions.map((p) => p.perf_tier));

  const budgetsByQuery = new Map();
  for (const b of budgets) {
    const list = budgetsByQuery.get(b.query_id) || [];
    list.push(b);
    budgetsByQuery.set(b.query_id, list);
  }
  const queryIds = new Set(queries.map((q) => q.query_id));

  const bad = [];
  for (const mod of modules) {
    for (const qid of mod.provides.datasources || []) {
      if (!queryIds.has(qid)) {
        bad.push(`${mod.module_id}:${qid}:missing_query`);
        continue;
      }
      const b = budgetsByQuery.get(qid) || [];
      const tierSet = new Set(b.map((x) => x.tier));
      for (const t of tiers) {
        if (!tierSet.has(t)) bad.push(`${mod.module_id}:${qid}:missing_budget:${t}`);
      }
    }
  }
  const ok = bad.length === 0;
  return { ok, gate: "Budget Coverage Gate", details: ok ? "" : bad.join(", ") };
}

export function moduleAuthoringGate({ ssotDir }) {
  const modules = readJson(`${ssotDir}/modules/domain_modules.json`);
  const bad = [];
  for (const m of modules) {
    if (!m.module_id || !m.name) bad.push(`${m.module_id || "missing"}:metadata`);
    const provides = m.provides || {};
    const keys = ["pages", "routes", "nav", "widgets", "forms", "workflows", "datasources"];
    for (const k of keys) {
      if (!Array.isArray(provides[k])) bad.push(`${m.module_id}:${k}:missing`);
    }
  }
  const ok = bad.length === 0;
  return { ok, gate: "Module Authoring Gate", details: ok ? "" : bad.join(", ") };
}

export function activationSafetyGate({ ssotDir }) {
  const modules = readJson(`${ssotDir}/modules/domain_modules.json`);
  const versions = readJson(`${ssotDir}/modules/domain_module_versions.json`);
  const activations = readJson(`${ssotDir}/modules/module_activations.json`);
  const moduleIds = new Set(modules.map((m) => m.module_id));
  const activeModules = new Set(versions.filter((v) => v.status === "active").map((v) => v.module_id));
  const bad = [];
  for (const a of activations) {
    if (!moduleIds.has(a.module_id)) bad.push(`activation:${a.module_id}:missing_module`);
    if (!activeModules.has(a.module_id)) bad.push(`activation:${a.module_id}:inactive_version`);
  }
  const ok = bad.length === 0;
  return { ok, gate: "Activation Safety Gate", details: ok ? "" : bad.join(", ") };
}

function normalizeTier(tier) {
  if (tier === "enterprise") return "ent";
  return tier || "free";
}

function tierRank(tier) {
  const t = normalizeTier(tier);
  if (t === "ent") return 3;
  if (t === "pro") return 2;
  return 1;
}

export function marketplacePermissionGate({ ssotDir }) {
  const perms = readJson(`${ssotDir}/extensions/extension_permissions.json`);
  const allowed = new Set(["finops.read", "qos.read", "documents.ingest", "jobs.create"]);
  const bad = [];
  for (const p of perms) {
    for (const cap of p.requested_capabilities || []) {
      if (!allowed.has(cap)) bad.push(`${p.extension_id}:${cap}`);
    }
  }
  const ok = bad.length === 0;
  return { ok, gate: "Marketplace Permission Gate", details: ok ? "" : bad.join(", ") };
}

export function marketplacePlanGate({ ssotDir }) {
  const tenants = readJson(`${ssotDir}/tenancy/tenants.json`);
  const overrides = readJson(`${ssotDir}/tenancy/tenant_overrides.json`);
  const plans = readJson(`${ssotDir}/tenancy/plans.json`);
  const planVersions = readJson(`${ssotDir}/tenancy/plan_versions.json`);
  const modules = readJson(`${ssotDir}/modules/domain_modules.json`);
  const activations = readJson(`${ssotDir}/modules/module_activations.json`);
  const extensions = readJson(`${ssotDir}/extensions/extensions.json`);
  const installs = readJson(`${ssotDir}/extensions/extension_installations.json`);
  const tenantSet = new Set(tenants.map((t) => t.tenant_id));
  const bad = [];
  for (const a of activations) {
    if (a.tenant_id === "tenant:default") continue;
    if (!tenantSet.has(a.tenant_id)) continue;
    if (a.state !== "active") continue;
    const override = overrides.find((o) => o.tenant_id === a.tenant_id);
    const tenant = tenants.find((t) => t.tenant_id === a.tenant_id);
    const planId = override?.plan_id || tenant?.plan_id || "plan:free";
    const plan = plans.find((p) => p.plan_id === planId);
    const pv = planVersions.filter((p) => p.plan_id === planId).slice(-1)[0];
    const planTier = normalizeTier(pv?.perf_tier || plan?.tier || "free");
    const mod = modules.find((m) => m.module_id === a.module_id);
    if (mod && tierRank(mod.tier) > tierRank(planTier)) bad.push(`module:${a.tenant_id}:${a.module_id}:tier_block`);
  }
  for (const i of installs) {
    if (i.tenant_id === "tenant:default") continue;
    if (!tenantSet.has(i.tenant_id)) continue;
    if (i.state !== "installed") continue;
    const override = overrides.find((o) => o.tenant_id === i.tenant_id);
    const tenant = tenants.find((t) => t.tenant_id === i.tenant_id);
    const planId = override?.plan_id || tenant?.plan_id || "plan:free";
    const plan = plans.find((p) => p.plan_id === planId);
    const pv = planVersions.filter((p) => p.plan_id === planId).slice(-1)[0];
    const planTier = normalizeTier(pv?.perf_tier || plan?.tier || "free");
    const ext = extensions.find((e) => e.id === i.extension_id);
    if (ext && tierRank(ext.tier || "free") > tierRank(planTier)) bad.push(`extension:${i.tenant_id}:${i.extension_id}:tier_block`);
  }
  const ok = bad.length === 0;
  return { ok, gate: "Marketplace Plan Gate", details: ok ? "" : bad.join(", ") };
}

export function marketplaceImpactGate({ ssotDir }) {
  const perms = readJson(`${ssotDir}/extensions/extension_permissions.json`);
  const exportControls = readJson(`${ssotDir}/data/policies/export_controls.json`);
  const hasMasking = exportControls.some((c) => c.masking_required === true);
  const risky = perms.some((p) => (p.requested_capabilities || []).includes("documents.ingest"));
  const ok = !risky || hasMasking;
  return { ok, gate: "Marketplace Impact Gate", details: ok ? "" : "Missing export masking controls" };
}

export function marketplaceCompatGate({ ssotDir }) {
  const activations = readJson(`${ssotDir}/modules/module_activations.json`);
  const versions = readJson(`${ssotDir}/modules/domain_module_versions.json`);
  const installs = readJson(`${ssotDir}/extensions/extension_installations.json`);
  const extVersions = readJson(`${ssotDir}/extensions/extension_versions.json`);
  const bad = [];
  for (const a of activations) {
    if (a.state !== "active") continue;
    const v = versions.find((x) => x.module_id === a.module_id && x.status === "deprecated");
    if (v) bad.push(`module:${a.module_id}:deprecated_active`);
  }
  for (const i of installs) {
    if (i.state !== "installed") continue;
    const v = extVersions.find((x) => x.extension_id === i.extension_id && x.version === i.version);
    if (v && v.status === "draft") bad.push(`extension:${i.extension_id}@${i.version}:draft_installed`);
  }
  const ok = bad.length === 0;
  return { ok, gate: "Marketplace Compat Gate", details: ok ? "" : bad.join(", ") };
}

export function billingDormantGate({ ssotDir }) {
  const mode = readJson(`${ssotDir}/billing/billing_mode.json`);
  const reviewsDir = `${ssotDir}/changes/reviews`;
  const needsQuorum = mode.enabled || mode.allow_external_charges;
  const approvals = [];
  if (existsSync(reviewsDir)) {
    for (const f of readdirSync(reviewsDir).filter((x) => x.endsWith(".json"))) {
      approvals.push(readJson(`${reviewsDir}/${f}`));
    }
  }
  const approved = approvals.find((r) => r.action === "billing.activate" && r.target_id === "billing_mode" && r.status === "approved");
  const bad = [];
  if (!mode.enabled) {
    if (mode.allow_external_charges) bad.push("allow_external_charges_true");
    if (mode.scopes?.invoice_publish) bad.push("invoice_publish_enabled");
    if (mode.scopes?.provider_webhooks) bad.push("provider_webhooks_enabled");
  }
  if (needsQuorum && !approved) bad.push("missing_quorum");
  const ok = bad.length === 0;
  return { ok, gate: "Billing Dormant Gate", details: ok ? "" : bad.join(", ") };
}

export function ratingIntegrityGate({ ssotDir }) {
  const meters = readJson(`${ssotDir}/finops/metering_catalog.json`).map((m) => m.meter_id);
  const rules = readJson(`${ssotDir}/billing/rating_rules.json`);
  const ruleMeters = new Set(rules.map((r) => r.meter_id));
  const bad = [];
  for (const m of meters) {
    if (!ruleMeters.has(m)) bad.push(`missing_rule:${m}`);
  }
  for (const r of rules) {
    if (r.unit_price < 0) bad.push(`negative_price:${r.rule_id}`);
    if (r.cap < 0) bad.push(`negative_cap:${r.rule_id}`);
  }
  const ok = bad.length === 0;
  return { ok, gate: "Rating Integrity Gate", details: ok ? "" : bad.join(", ") };
}

export function invoiceNoSecretsGate() {
  const runtimeDir = process.env.RUNTIME_DIR || "./platform/runtime";
  const draftsDir = `${runtimeDir}/billing/drafts`;
  if (!existsSync(draftsDir)) return { ok: true, gate: "Invoice No Secrets Gate", details: "" };
  const bad = [];
  const scan = (p) => {
    const entries = readdirSync(p, { withFileTypes: true });
    for (const e of entries) {
      const full = `${p}/${e.name}`;
      if (e.isDirectory()) scan(full);
      else if (e.name.endsWith(".json")) {
        const txt = readFileSync(full, "utf-8");
        if (/(secret|api_key|token|password)/i.test(txt)) bad.push(full);
      }
    }
  };
  scan(draftsDir);
  const ok = bad.length === 0;
  return { ok, gate: "Invoice No Secrets Gate", details: ok ? "" : `Secrets in drafts: ${bad.join(", ")}` };
}

function scanFilesForSecrets(paths) {
  const bad = [];
  const allow = ["sec:ref:"];
  const scanFile = (filePath) => {
    let txt = readFileSync(filePath, "utf-8");
    if (filePath.endsWith(".json")) {
      try {
        const obj = JSON.parse(txt);
        const scrub = (o) => {
          if (!o || typeof o !== "object") return;
          for (const [k, v] of Object.entries(o)) {
            if (typeof v === "object") scrub(v);
            const key = String(k).toLowerCase();
            if (key.includes("signature") || key.includes("checksum") || key.includes("hash")) {
              o[k] = "__redacted__";
            }
          }
        };
        scrub(obj);
        txt = JSON.stringify(obj);
      } catch {
        // keep original
      }
    }
    if (allow.some((a) => txt.includes(a))) return;
    for (const re of SECRET_PATTERNS) {
      const m = txt.match(re);
      if (m) {
        bad.push(`${filePath}:pattern`);
        break;
      }
    }
  };
  const scanDir = (p) => {
    if (!existsSync(p)) return;
    const entries = readdirSync(p, { withFileTypes: true });
    for (const e of entries) {
      const full = `${p}/${e.name}`;
      if (e.isDirectory()) scanDir(full);
      else scanFile(full);
    }
  };
  for (const p of paths) scanDir(p);
  return bad;
}

export function noSecretsEvidenceGate() {
  const reportsDir = "./runtime/reports";
  const manifestsDir = "./runtime/manifests";
  const bad = scanFilesForSecrets([reportsDir, manifestsDir]);
  const ok = bad.length === 0;
  return { ok, gate: "No Secrets Evidence Gate", details: ok ? "" : `Secrets detected: ${bad.join(", ")}` };
}

export function runbookIntegrityGate({ ssotDir }) {
  const runbooks = readJson(`${ssotDir}/ops/runbooks.json`);
  const versions = readJson(`${ssotDir}/ops/runbook_versions.json`);
  const bad = [];
  for (const rb of runbooks) {
    const rv = versions.find((v) => v.runbook_id === rb.runbook_id && v.version === rb.latest_version);
    if (!rv) bad.push(`${rb.runbook_id}:missing_version`);
  }
  for (const rv of versions) {
    for (const step of rv.steps || []) {
      if (!OPS_ALLOWED_ACTIONS.includes(step.action)) bad.push(`${rv.runbook_id}@${rv.version}:${step.action}`);
    }
  }
  const ok = bad.length === 0;
  return { ok, gate: "Runbook Integrity Gate", details: ok ? "" : `Invalid runbooks: ${bad.join(", ")}` };
}

export function breakGlassGate({ ssotDir }) {
  const bg = readJson(`${ssotDir}/governance/break_glass.json`);
  if (!bg?.enabled) return { ok: true, gate: "BreakGlass Gate", details: "" };
  const bad = [];
  if (!bg.expires_at) bad.push("missing_expires_at");
  if (!(bg.allowed_actions || []).length) bad.push("empty_allowlist");
  const forbidden = (bg.allowed_actions || []).filter((a) => a.startsWith("governance") || a === "governance.*");
  if (forbidden.length) bad.push(`forbidden_actions:${forbidden.join(",")}`);
  const ok = bad.length === 0;
  return { ok, gate: "BreakGlass Gate", details: ok ? "" : bad.join(" | ") };
}

export function semverGate({ ssotDir, manifestsDir, releaseId }) {
  const bad = [];
  const check = (items, label) => {
    for (const it of items || []) {
      if (!isValidSemver(it.version)) bad.push(`${label}:${it.version || ""}`);
    }
  };
  check(readJson(`${ssotDir}/tenancy/plan_versions.json`), "plan_version");
  check(readJson(`${ssotDir}/extensions/extension_versions.json`), "extension_version");
  check(readJson(`${ssotDir}/integrations/connector_versions.json`), "connector_version");
  check(readJson(`${ssotDir}/data/catalog/data_model_versions.json`), "data_model_version");
  check(readJson(`${ssotDir}/qos/qos_versions.json`), "qos_version");
  check(readJson(`${ssotDir}/finops/metering_versions.json`), "metering_version");
  check(readJson(`${ssotDir}/ops/runbook_versions.json`), "runbook_version");
  check(readJson(`${ssotDir}/compat/migration_versions.json`), "migration_version");
  for (const v of readJson(`${ssotDir}/compat/compatibility_versions.json`)) {
    if (!isValidSemver(v.from_version) || !isValidSemver(v.to_version)) bad.push(`compatibility_version:${v.from_version}->${v.to_version}`);
  }
  check(readJson(`${ssotDir}/compat/deprecation_versions.json`), "deprecation_version");
  try {
    const manifest = readJson(`${manifestsDir || "./runtime/manifests"}/platform_manifest.${releaseId}.json`);
    if (!isValidSemver(manifest.manifest_version)) bad.push(`platform_manifest:${manifest.manifest_version}`);
  } catch {
    // ignore if manifest missing
  }
  const ok = bad.length === 0;
  return { ok, gate: "SemVer Gate", details: ok ? "" : bad.join(", ") };
}

export function compatibilityGate({ ssotDir }) {
  const matrix = readJson(`${ssotDir}/compat/compatibility_matrix.json`);
  const versions = readJson(`${ssotDir}/compat/compatibility_versions.json`);
  const bad = [];
  for (const m of matrix) {
    if (!isValidSemver(m.from_version) || !isValidSemver(m.to_version)) bad.push(`${m.from_version}->${m.to_version}:invalid_semver`);
    if (isMajorBump(m.from_version, m.to_version) && !m.requires_migration) bad.push(`${m.from_version}->${m.to_version}:missing_migration`);
    if (m.requires_migration && !(m.migration_ids || []).length) bad.push(`${m.from_version}->${m.to_version}:no_migrations`);
  }
  for (const v of versions) {
    if (!isValidSemver(v.from_version) || !isValidSemver(v.to_version)) bad.push(`${v.from_version}->${v.to_version}:invalid_semver`);
    if (!v.allowed) bad.push(`${v.from_version}->${v.to_version}:disallowed`);
  }
  const ok = bad.length === 0;
  return { ok, gate: "Compatibility Gate", details: ok ? "" : bad.join(", ") };
}

export function deprecationGate({ ssotDir }) {
  const deps = readJson(`${ssotDir}/compat/deprecations.json`);
  const bad = [];
  for (const d of deps) {
    if (!isValidSemver(d.introduced_in) || !isValidSemver(d.deprecated_in) || !isValidSemver(d.removal_in)) {
      bad.push(`${d.target_type}:${d.target_id}:invalid_semver`);
      continue;
    }
    if (!isMajorBump(d.deprecated_in, d.removal_in)) bad.push(`${d.target_type}:${d.target_id}:removal_not_major`);
  }
  const ok = bad.length === 0;
  return { ok, gate: "Deprecation Gate", details: ok ? "" : bad.join(", ") };
}

export function migrationGate({ ssotDir }) {
  const migrations = readJson(`${ssotDir}/compat/migrations.json`);
  const bad = [];
  for (const m of migrations) {
    if (!m.dry_run_supported) bad.push(`${m.migration_id}:no_dry_run`);
  }
  const ok = bad.length === 0;
  return { ok, gate: "Migration Gate", details: ok ? "" : bad.join(", ") };
}

export function contractTestGate({ ssotDir }) {
  const compat = readJson(`${ssotDir}/compat/compatibility_matrix.json`);
  const ok = compat.length > 0;
  return { ok, gate: "Contract Test Gate", details: ok ? "" : "Missing compatibility matrix" };
}

export function tenantTemplateGate({ ssotDir }) {
  const templates = readJson(`${ssotDir}/tenancy/tenant_templates.json`);
  const plans = readJson(`${ssotDir}/tenancy/plans.json`);
  const entitlements = readJson(`${ssotDir}/tenancy/entitlements.json`);
  const flags = readJson(`${ssotDir}/tenancy/feature_flags.json`);
  const themes = readJson(`${ssotDir}/design/themes.json`);
  const modules = readJson(`${ssotDir}/modules/domain_modules.json`);
  const planIds = new Set(plans.map((p) => p.plan_id));
  const entIds = new Set(entitlements.map((e) => e.entitlement_id || e.id));
  const flagIds = new Set(flags.map((f) => f.flag_id || f.id));
  const themeIds = new Set(themes.map((t) => t.theme_id || t.id));
  const moduleIds = new Set(modules.map((m) => m.module_id));
  const bad = [];
  for (const t of templates) {
    if (!planIds.has(t.base_plan_id)) bad.push(`${t.template_id}:plan`);
    for (const e of t.entitlements_default || []) if (!entIds.has(e)) bad.push(`${t.template_id}:entitlement:${e}`);
    for (const f of t.feature_flags_default || []) if (!flagIds.has(f)) bad.push(`${t.template_id}:flag:${f}`);
    const themeId = t.theme_binding?.theme_id;
    if (themeId && !themeIds.has(themeId)) bad.push(`${t.template_id}:theme:${themeId}`);
    for (const m of t.module_activations_default || []) {
      if (!moduleIds.has(m.module_id)) bad.push(`${t.template_id}:module:${m.module_id}`);
    }
  }
  const ok = bad.length === 0;
  return { ok, gate: "Tenant Template Gate", details: ok ? "" : bad.join(", ") };
}

export function templateIntegrityGate({ ssotDir }) {
  const templates = readJson(`${ssotDir}/tenancy/tenant_templates.json`);
  const templateVersions = readJson(`${ssotDir}/tenancy/tenant_template_versions.json`);
  const modules = readJson(`${ssotDir}/modules/domain_modules.json`);
  const moduleById = new Map(modules.map((m) => [m.module_id, m]));
  const versionByTemplate = new Map();
  for (const v of templateVersions || []) {
    if (v.status !== "active") continue;
    versionByTemplate.set(v.template_id, v);
  }
  const bad = [];
  for (const t of templates) {
    if (t.base_plan_id !== "plan:free") continue;
    const v = versionByTemplate.get(t.template_id);
    const activations = (v && v.module_activations_default) || t.module_activations_default || [];
    const offenders = [];
    for (const a of activations) {
      if (a.state && a.state !== "active") continue;
      const mod = moduleById.get(a.module_id);
      if (mod && tierRank(mod.tier) > tierRank("free")) {
        offenders.push({ module_id: a.module_id, min_tier: mod.tier || "pro" });
      }
    }
    if (offenders.length) {
      const list = offenders.map((o) => `${o.module_id}(${o.min_tier})`).join(", ");
      bad.push(`template_id=${t.template_id} base_plan_id=${t.base_plan_id} offenders=${list} action=use tmpl:marketplace-free OR set base_plan_id plan:pro OR disable module`);
    }
  }
  const ok = bad.length === 0;
  return { ok, gate: "Template Integrity Gate", details: ok ? "" : bad.join(" | ") };
}

export function tenantFactoryGate({ ssotDir }) {
  const tenants = readJson(`${ssotDir}/tenancy/tenants.json`);
  const ids = tenants.map((t) => t.tenant_id);
  const uniqueOk = new Set(ids).size === ids.length;
  const bad = [];
  const re = /^tenant:[a-z0-9-]+$/;
  for (const id of ids) if (!re.test(id)) bad.push(`invalid:${id}`);

  const scans = [
    readJson(`${ssotDir}/tenancy/tenant_overrides.json`),
    readJson(`${ssotDir}/tenancy/tenant_quotas.json`),
    readJson(`${ssotDir}/tenancy/tenant_entitlements.json`),
    readJson(`${ssotDir}/tenancy/tenant_flags.json`)
  ];
  for (const list of scans) {
    for (const item of list || []) {
      const keys = Object.keys(item || {});
      if (keys.some((k) => SECRET_KEYS.some((s) => k.toLowerCase().includes(s)))) bad.push("secret_key_detected");
    }
  }
  const ok = uniqueOk && bad.length === 0;
  const details = [];
  if (!uniqueOk) details.push("duplicate_tenant_id");
  if (bad.length) details.push(bad.join(", "));
  return { ok, gate: "Tenant Factory Gate", details: details.join(" | ") };
}

export function designFreezeGate({ ssotDir }) {
  const constraints = readJson(`${ssotDir}/design/ux_constraints.json`);
  const freeze = constraints.find((c) => c.freeze_design === true);
  const ok = !freeze;
  return { ok, gate: "Design Freeze Gate", details: ok ? "" : "Design is frozen" };
}
