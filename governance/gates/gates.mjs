import { readFileSync } from "fs";
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
  const pageIds = new Set(pages.map((p) => p.id));
  const orphanRoutes = routes.filter((r) => !pageIds.has(r.page_id));
  const ok = orphanRoutes.length === 0;
  return { ok, gate: "Orphan Gate", details: ok ? "" : `Orphan routes: ${orphanRoutes.map((r) => r.route_id).join(", ")}` };
}

export function policyGate({ manifestsDir, releaseId }) {
  const routes = readJson(`${manifestsDir || "./runtime/manifests"}/route_catalog.${releaseId}.json`).routes;
  const missing = routes.filter((r) => !r.guard_pack_id || r.guard_pack_id === "");
  const ok = missing.length === 0;
  return { ok, gate: "Policy Gate", details: ok ? "" : `Routes without guard: ${missing.map((r) => r.route_id).join(", ")}` };
}

export function tokenGate({ ssotDir }) {
  const widgets = readJson(`${ssotDir}/studio/widgets/widget_instances.json`);
  const offenders = widgets.filter((w) => {
    if (!w.props) return false;
    const keys = Object.keys(w.props);
    const hasInline = keys.some((k) => k.toLowerCase().includes("style") || k.toLowerCase().includes("class"));
    const hasHardcodedColor = Object.values(w.props).some((v) => typeof v === "string" && (v.includes("#") || v.includes("rgb(")));
    return hasInline || hasHardcodedColor;
  });
  const ok = offenders.length === 0;
  return { ok, gate: "Token Gate", details: ok ? "" : `Hardcoded styles in widgets: ${offenders.map((w) => w.id).join(", ")}` };
}

export function accessGate({ ssotDir }) {
  const pages = readJson(`${ssotDir}/studio/pages/page_definitions.json`);
  const capabilities = new Set(readJson(`${ssotDir}/registry/capabilities.json`));
  const missing = [];
  for (const p of pages) {
    for (const cap of p.capabilities_required || []) {
      if (!capabilities.has(cap)) missing.push(`${p.id}:${cap}`);
    }
  }
  const ok = missing.length === 0;
  return { ok, gate: "Access Gate", details: ok ? "" : `Missing capabilities: ${missing.join(", ")}` };
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
  const manifestChecksum = sha256(stableStringify(manifest));
  const ok = checksums.manifest === manifestChecksum;
  return { ok, gate: "Drift Gate", details: ok ? "" : "Manifest checksum mismatch" };
}

export function designFreezeGate({ ssotDir }) {
  const constraints = readJson(`${ssotDir}/design/ux_constraints.json`);
  const freeze = constraints.find((c) => c.freeze_design === true);
  const ok = !freeze;
  return { ok, gate: "Design Freeze Gate", details: ok ? "" : "Design is frozen" };
}

export function quorumGate({ ssotDir }) {
  const reviews = readJsonIfExists(`${ssotDir}/changes/reviews/reviews.json`);
  if (!reviews) return { ok: true, gate: "Quorum Gate", details: "" };
  const approvals = Array.isArray(reviews) ? reviews.filter((r) => r.status === "approved").length : 0;
  const quorumOk = approvals >= (reviews.quorum || 0);
  return { ok: quorumOk, gate: "Quorum Gate", details: quorumOk ? "" : "Quorum not met" };
}
