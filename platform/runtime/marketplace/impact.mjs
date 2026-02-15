import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { getReportsDir, assertNoPlatformReportsPath } from "../../../scripts/ci/test-utils.mjs";

function diffSet(a, b) {
  const setA = new Set(a);
  const setB = new Set(b);
  const added = [...setB].filter((x) => !setA.has(x));
  const removed = [...setA].filter((x) => !setB.has(x));
  return { added, removed };
}

function listRoutes(manifest) {
  return (manifest?.routes?.routes || []).map((r) => r.path);
}

function listNav(manifest) {
  return (manifest?.nav?.nav_specs || []).map((n) => n.path || n.id);
}

function listPages(manifest) {
  return (manifest?.pages?.pages || []).map((p) => p.id);
}

function listGuardPacks(manifest) {
  const packs = manifest?.permissions?.guard_packs;
  if (Array.isArray(packs)) return packs.map((p) => p.id || p.guard_pack_id || p.name).filter(Boolean);
  return [];
}

function dataGovRisk(manifest) {
  const fields = manifest?.data_catalog?.data_fields || [];
  const risky = new Set(["pii.high", "secrets", "financial"]);
  const count = fields.filter((f) => risky.has(f.classification_id)).length;
  return { risky_fields: count };
}

export function analyzeInstall({ activeManifest, previewManifest, tenantId, item, meta = {} }) {
  const routes = diffSet(listRoutes(activeManifest), listRoutes(previewManifest));
  const nav = diffSet(listNav(activeManifest), listNav(previewManifest));
  const pages = diffSet(listPages(activeManifest), listPages(previewManifest));
  const perms = diffSet(listGuardPacks(activeManifest), listGuardPacks(previewManifest));
  const dataGov = dataGovRisk(previewManifest);
  const breaking = routes.removed.length > 0 || nav.removed.length > 0 || pages.removed.length > 0;
  const compat = { requires_migration: false };
  const result = {
    tenant_id: tenantId,
    item,
    deltas: { routes, nav, pages, permissions: perms },
    data_gov: dataGov,
    compat,
    breaking
  };

  const reportsDir = getReportsDir();
  assertNoPlatformReportsPath(reportsDir);
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const path = join(reportsDir, `MARKETPLACE_IMPACT_${ts}.md`);
  const indexPath = join(reportsDir, "index", "marketplace_events.jsonl");
  const header = [
    `request_id: ${meta.request_id || ""}`,
    `tenant_id: ${tenantId}`,
    `plan_effective: ${meta.plan_effective?.plan_id || ""} ${meta.plan_effective?.plan_version || ""} ${meta.plan_effective?.tier || ""}`.trim(),
    `item: ${item.type} ${item.id} v${item.version}`,
    `action: ${meta.action || "impact"}`,
    `timestamp: ${new Date().toISOString()}`,
    `policy_decision: ${meta.policy_decision || ""}`,
    `changeset_id: ${meta.changeset_id || ""}`,
    `compile_ms: ${meta.compile_ms || ""}`,
    `manifest_id: ${meta.manifest_id || ""}`
  ];
  const lines = [
    `# Marketplace Impact`,
    ...header,
    `breaking: ${breaking}`,
    ``,
    `## Routes`,
    `added: ${routes.added.length}`,
    `removed: ${routes.removed.length}`,
    ``,
    `## Nav`,
    `added: ${nav.added.length}`,
    `removed: ${nav.removed.length}`,
    ``,
    `## Pages`,
    `added: ${pages.added.length}`,
    `removed: ${pages.removed.length}`,
    ``,
    `## Permissions`,
    `added: ${perms.added.length}`,
    `removed: ${perms.removed.length}`,
    ``,
    `## DataGov`,
    `risky_fields: ${dataGov.risky_fields}`
  ];
  writeFileSync(path, lines.join("\n") + "\n", "utf-8");
  mkdirSync(join(reportsDir, "index"), { recursive: true });
  writeFileSync(indexPath, JSON.stringify({
    ts: new Date().toISOString(),
    request_id: meta.request_id || "",
    tenant_id: tenantId,
    action: meta.action || "impact",
    item,
    outcome: "ok",
    report_path: path
  }) + "\n", { flag: "a" });
  return { result, report_path: path };
}
