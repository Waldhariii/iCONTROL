import { readJson, writeJson } from "./utils.mjs";
import { validateOrThrow } from "../../core/contracts/schema/validate.mjs";

export function compileNav({ ssotDir, outDir, releaseId }) {
  const navSpecs = readJson(`${ssotDir}/studio/nav/nav_specs.json`);
  const navInstances = readJson(`${ssotDir}/studio/nav/nav_instances.json`);

  const navManifest = {
    release_id: releaseId,
    nav_specs: navSpecs,
    nav_instances: navInstances
  };

  writeJson(`${outDir}/nav_manifest.${releaseId}.json`, navManifest);
  validateOrThrow("nav_manifest.v1", navManifest, "nav_manifest");
  return navManifest;
}
