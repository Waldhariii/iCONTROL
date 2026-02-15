/**
 * Phase AA: render_graph v2 smoke — compile produces sections_v2; client can use tabs/widgets.
 */
import { readFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { execSync } from "child_process";
import { createTempSsot } from "./test-utils.mjs";

function readJson(p) {
  return JSON.parse(readFileSync(p, "utf-8"));
}

const temp = createTempSsot();
const ssotDir = temp.ssotDir;
const outDir = join(dirname(dirname(ssotDir)), "runtime", "manifests");
mkdirSync(outDir, { recursive: true });

execSync("node scripts/ci/compile.mjs dev-001 dev", {
  stdio: "inherit",
  env: { ...process.env, SSOT_DIR: ssotDir, OUT_DIR: outDir }
});

const renderGraph = readJson(join(outDir, "render_graph.dev-001.json"));
if (!Array.isArray(renderGraph.sections_v2)) throw new Error("render_graph missing sections_v2 array");
const withSections = renderGraph.sections_v2.filter((ps) => (ps.sections || []).length > 0);
if (withSections.length === 0) throw new Error("sections_v2 has no page with sections");
const first = withSections[0];
const sections = first.sections || [];
if (sections.length === 0) throw new Error("First page sections_v2 has no sections");
console.log("Render graph v2 smoke PASS", { pagesWithSectionsV2: withSections.length });

temp.cleanup();
