import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

const releaseId = process.argv[2];
const mode = process.argv[3] || "--dry-run";
if (!releaseId) {
  console.error("Missing releaseId");
  process.exit(1);
}

const graph = readJson(`./runtime/manifests/dependency_graph.${releaseId}.json`);
const SSOT_DIR = process.env.SSOT_DIR || "./platform/ssot";
const referencedStrong = new Set(graph.edges.filter((e) => e.strength === "strong").map((e) => e.to));
const allNodes = new Set([...graph.edges.map((e) => e.from), ...graph.edges.map((e) => e.to)]);
const orphans = [...allNodes].filter((n) => !referencedStrong.has(n) && n.startsWith("widget:"));

const report = { release_id: releaseId, orphans, mode };

if (mode === "--apply") {
  const widgetPath = join(SSOT_DIR, "studio/widgets/widget_instances.json");
  const widgets = readJson(widgetPath);
  const orphanIds = new Set(orphans.filter((n) => n.startsWith("widget:")).map((n) => n.split(":")[1]));
  const kept = widgets.filter((w) => !orphanIds.has(w.id));
  writeFileSync(widgetPath, JSON.stringify(kept, null, 2) + "\n");
}

writeFileSync("./platform/runtime/deletion/gc_report.json", JSON.stringify(report, null, 2) + "\n");
console.log("GC report written");
