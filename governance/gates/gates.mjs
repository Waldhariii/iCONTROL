import { readFileSync, existsSync, readdirSync } from "fs";
import { stableStringify, sha256 } from "../../platform/compilers/utils.mjs";
import { validateOrThrow } from "../../core/contracts/schema/validate.mjs";
import { validateSsotDir } from "../../core/contracts/schema/validate-ssot.mjs";

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
  const cssPath = manifestRoot.includes("/runtime/manifests")
    ? `./platform/runtime/build_artifacts/theme_vars.${releaseId}.css`
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

export function perfBudgetGate({ ssotDir }) {
  const queries = readJson(`${ssotDir}/data/query_catalog.json`);
  const budgets = readJson(`${ssotDir}/data/query_budgets.json`);
  const budgetIds = new Set(budgets.map((b) => b.query_id));
  const missing = queries.filter((q) => !budgetIds.has(q.id));
  const ok = missing.length === 0;
  return { ok, gate: "Perf Budget Gate", details: ok ? "" : `Missing budgets for: ${missing.map((q) => q.id).join(", ")}` };
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
  const blocked = new Set([
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
  const offenders = [];
  for (const f of files) {
    const cs = readJson(`${dir}/${f}`);
    if (cs.status !== "draft" && cs.status !== "pending") continue;
    if (Number.isFinite(freezeAt)) {
      const createdAt = Date.parse(cs.created_at || "");
      if (Number.isFinite(createdAt) && createdAt < freezeAt) continue;
    }
    for (const op of cs.ops || []) {
      const kind = op?.target?.kind || "";
      if (blocked.has(kind)) offenders.push(`${cs.id}:${kind}`);
    }
  }
  const ok = offenders.length === 0;
  return { ok, gate: "Freeze Gate", details: ok ? "" : `Frozen changes present: ${offenders.join(", ")}` };
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

export function designFreezeGate({ ssotDir }) {
  const constraints = readJson(`${ssotDir}/design/ux_constraints.json`);
  const freeze = constraints.find((c) => c.freeze_design === true);
  const ok = !freeze;
  return { ok, gate: "Design Freeze Gate", details: ok ? "" : "Design is frozen" };
}
