import { readJson, writeJson } from "./utils.mjs";
import { validateOrThrow } from "../../core/contracts/schema/validate.mjs";

export function compilePages({ ssotDir, outDir, releaseId }) {
  const pageDefs = readJson(`${ssotDir}/studio/pages/page_definitions.json`);
  const pageVersions = readJson(`${ssotDir}/studio/pages/page_instances.json`);
  const layouts = readJson(`${ssotDir}/studio/layouts/layout_instances.json`);
  const widgets = readJson(`${ssotDir}/studio/widgets/widget_instances.json`);

  for (const p of pageDefs) validateOrThrow("page_definition.v1", p, "page_definitions");
  for (const pv of pageVersions) validateOrThrow("page_version.v1", pv, "page_versions");
  validateOrThrow("array_of_objects.v1", layouts, "layout_instances");
  validateOrThrow("array_of_objects.v1", widgets, "widget_instances");

  const renderGraph = {
    release_id: releaseId,
    pages: pageDefs,
    page_versions: pageVersions,
    layouts,
    widgets
  };

  writeJson(`${outDir}/render_graph.${releaseId}.json`, renderGraph);
  validateOrThrow("render_graph.v1", renderGraph, "render_graph");
  return renderGraph;
}
