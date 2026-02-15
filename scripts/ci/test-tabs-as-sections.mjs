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

const releaseId = "tabs-001";
execSync(`node scripts/ci/compile.mjs ${releaseId} dev`, {
  stdio: "inherit",
  env: { ...process.env, SSOT_DIR: ssotDir, OUT_DIR: outDir }
});

const renderGraph = readJson(join(outDir, `render_graph.${releaseId}.json`));
const routeCatalog = readJson(join(outDir, `route_catalog.${releaseId}.json`));

const sections = renderGraph.sections || [];
const jobsDetail = sections.filter((s) => s.page_id === "client-jobs-detail").map((s) => s.section_key);
const required = ["overview", "activity", "settings"];
for (const k of required) {
  if (!jobsDetail.includes(k)) throw new Error(`Missing section ${k} on client-jobs-detail`);
}

const badRoutes = routeCatalog.routes.filter((r) =>
  required.some((k) => r.path.endsWith(`/${k}`))
);
if (badRoutes.length) throw new Error(`Section routes detected: ${badRoutes.map((r) => r.path).join(", ")}`);

console.log("Tabs as sections PASS");

temp.cleanup();
