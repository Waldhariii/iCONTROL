/**
 * Phase AC.5: diff noise gate — two manifests identical except generated_at => classifyDiffNoise reports noiseOnly.
 */
import { classifyDiffNoise } from "../../platform/runtime/studio/diff-engine.mjs";

const base = {
  release_id: "dev-001",
  routes: { routes: [] },
  nav: { nav_specs: [] },
  pages: { pages: [], page_versions: [], widgets: [] },
  widgets: [],
  themes: { themes: [] }
};

const manifestA = { ...base, meta: { generated_at: "2025-01-01T00:00:00Z" } };
const manifestB = { ...base, meta: { generated_at: "2025-01-02T00:00:00Z" } };

const { noiseOnly, noiseFields } = classifyDiffNoise(manifestA, manifestB);
if (!noiseOnly) throw new Error(`Expected noiseOnly true, got noiseOnly=${noiseOnly}, noiseFields=${JSON.stringify(noiseFields)}`);
if (!noiseFields.some((p) => p.endsWith("generated_at"))) throw new Error("Expected differing path to include generated_at");

console.log("Diff noise gate PASS", { noiseOnly, noiseFields });
