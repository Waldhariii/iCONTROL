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

const releaseId = "rendergraph-001";
execSync(`node scripts/ci/compile.mjs ${releaseId} dev`, {
  stdio: "inherit",
  env: { ...process.env, SSOT_DIR: ssotDir, OUT_DIR: outDir }
});

const renderGraph = readJson(join(outDir, `render_graph.${releaseId}.json`));
const pages = renderGraph.pages || [];
const versions = renderGraph.page_versions || [];
const sections = renderGraph.sections || [];

const pageIds = pages.filter((p) => p.surface === "client").map((p) => p.id);
for (const pid of pageIds) {
  const pv = versions.find((v) => v.page_id === pid);
  if (!pv) throw new Error(`Missing page_version for ${pid}`);
  const sec = sections.filter((s) => s.page_id === pid);
  const allWidgetIds = new Set(pv.widget_instance_ids || []);
  const sectionWidgetIds = new Set(sec.flatMap((s) => s.widget_instance_ids || []));
  for (const wid of allWidgetIds) {
    if (!sectionWidgetIds.has(wid)) throw new Error(`Widget ${wid} not assigned to section for ${pid}`);
  }
}

console.log("Module pages render_graph PASS");

temp.cleanup();
