import { readJson, writeJson, stableStringify, sha256, signPayload, readKey, writeText } from "./utils.mjs";
import { validateOrThrow } from "../../core/contracts/schema/validate.mjs";

export function compilePlatform({ ssotDir, outDir, releaseId, env, privateKeyPath }) {
  const routeCatalog = readJson(`${outDir}/route_catalog.${releaseId}.json`);
  const navManifest = readJson(`${outDir}/nav_manifest.${releaseId}.json`);
  const themeManifest = readJson(`${outDir}/theme_manifest.${releaseId}.json`);
  const guards = readJson(`${outDir}/guards.${releaseId}.json`);
  const renderGraph = readJson(`${outDir}/render_graph.${releaseId}.json`);
  const datasourceContracts = readJson(`${outDir}/datasource_contracts.${releaseId}.json`);
  const workflowDags = readJson(`${outDir}/workflow_dags.${releaseId}.json`);

  const capabilities = readJson(`${ssotDir}/registry/capabilities.json`);
  const modules = readJson(`${ssotDir}/registry/modules.json`);

  const manifest = {
    manifest_id: `manifest:${releaseId}`,
    manifest_version: "1.0.0",
    manifest_env: env,
    release_id: releaseId,
    signature: "",
    checksums: {},
    compat_matrix: { runtime: ">=1.0.0" },
    routes: routeCatalog,
    nav: navManifest,
    pages: renderGraph,
    widgets: renderGraph.widgets || [],
    themes: themeManifest,
    permissions: guards,
    datasources: datasourceContracts,
    workflows: workflowDags,
    capabilities,
    modules
  };

  const checksums = {
    manifest: "",
    routes: sha256(stableStringify(routeCatalog)),
    nav: sha256(stableStringify(navManifest)),
    themes: sha256(stableStringify(themeManifest)),
    guards: sha256(stableStringify(guards)),
    render_graph: sha256(stableStringify(renderGraph)),
    datasource_contracts: sha256(stableStringify(datasourceContracts)),
    workflow_dags: sha256(stableStringify(workflowDags))
  };

  manifest.checksums = checksums;
  const manifestJson = stableStringify({ ...manifest, signature: "" });
  manifest.checksums.manifest = sha256(manifestJson);

  const manifestPayload = stableStringify({ ...manifest, signature: "" });
  const privateKey = readKey(privateKeyPath);
  const signature = signPayload(manifestPayload, privateKey);
  manifest.signature = signature;

  writeJson(`${outDir}/platform_manifest.${releaseId}.json`, manifest);
  writeText(`${outDir}/platform_manifest.${releaseId}.sig`, signature);
  writeJson(`${outDir}/checksums.${releaseId}.json`, checksums);
  writeJson(`${outDir}/compat_matrix.${releaseId}.json`, manifest.compat_matrix);

  validateOrThrow("checksums.v1", checksums, "checksums");
  validateOrThrow("compat_matrix.v1", manifest.compat_matrix, "compat_matrix");
  validateOrThrow("platform_manifest.v1", manifest, "platform_manifest");

  return manifest;
}
