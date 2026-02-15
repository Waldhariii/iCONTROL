import { readJson, writeJson } from "./utils.mjs";
import { validateOrThrow } from "../../core/contracts/schema/validate.mjs";

export function compileNav({ ssotDir, outDir, releaseId }) {
  const navSpecs = readJson(`${ssotDir}/studio/nav/nav_specs.json`);
  const navInstances = readJson(`${ssotDir}/studio/nav/nav_instances.json`);
  const sectionsByPage = {};
  for (const n of navSpecs) {
    if (n.type !== "section") continue;
    if (!n.page_id || !n.section_key) continue;
    if (!sectionsByPage[n.page_id]) sectionsByPage[n.page_id] = [];
    sectionsByPage[n.page_id].push({
      section_key: n.section_key,
      title_key: n.label_key || n.label || n.section_key,
      order: Number.isInteger(n.order) ? n.order : 0
    });
  }
  for (const pageId of Object.keys(sectionsByPage)) {
    sectionsByPage[pageId].sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  const navManifest = {
    release_id: releaseId,
    nav_specs: navSpecs,
    nav_instances: navInstances,
    sections_by_page: sectionsByPage
  };

  writeJson(`${outDir}/nav_manifest.${releaseId}.json`, navManifest);
  validateOrThrow("nav_manifest.v1", navManifest, "nav_manifest");
  return navManifest;
}
