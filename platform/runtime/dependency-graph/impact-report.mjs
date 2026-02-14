import { readFileSync, writeFileSync } from "fs";

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

const releaseId = process.argv[2];
const target = process.argv[3];
if (!releaseId || !target) {
  console.error("Usage: node impact-report.mjs <releaseId> <nodeId>");
  process.exit(1);
}

const graph = readJson(`./runtime/manifests/dependency_graph.${releaseId}.json`);
const impacted = graph.edges.filter((e) => e.to === target || e.from === target);
const report = { release_id: releaseId, target, impacted };
writeFileSync("./platform/runtime/dependency-graph/impact_report.json", JSON.stringify(report, null, 2) + "\n");
console.log("Impact report written");
