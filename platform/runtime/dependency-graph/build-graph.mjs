import { readFileSync, writeFileSync } from "fs";

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

const releaseId = process.argv[2];
if (!releaseId) {
  console.error("Missing releaseId");
  process.exit(1);
}

const ssotDir = "./platform/ssot";

const pages = readJson(`${ssotDir}/studio/pages/page_definitions.json`);
const pageVersions = readJson(`${ssotDir}/studio/pages/page_instances.json`);
const routes = readJson(`./runtime/manifests/route_catalog.${releaseId}.json`).routes;
const navSpecs = readJson(`${ssotDir}/studio/nav/nav_specs.json`);
const widgets = readJson(`${ssotDir}/studio/widgets/widget_instances.json`);
const datasources = readJson(`${ssotDir}/data/datasource_catalog.json`);
const permissions = readJson(`${ssotDir}/governance/permissions.json`);
const tokens = readJson(`${ssotDir}/design/design_tokens.json`);

const graph = {
  release_id: releaseId,
  edges: []
};

for (const r of routes) graph.edges.push({ from: `route:${r.route_id}`, to: `page:${r.page_id}`, strength: "strong" });
for (const n of navSpecs) {
  if (n.route_id) graph.edges.push({ from: `nav:${n.id}`, to: `route:${n.route_id}`, strength: "strong" });
}
for (const pv of pageVersions) {
  if (pv.layout_instance_id) graph.edges.push({ from: `page:${pv.page_id}`, to: `layout:${pv.layout_instance_id}`, strength: "strong" });
  for (const wid of pv.widget_instance_ids || []) graph.edges.push({ from: `page:${pv.page_id}`, to: `widget:${wid}`, strength: "strong" });
}
for (const w of widgets) {
  if (w.datasource_id) graph.edges.push({ from: `widget:${w.id}`, to: `datasource:${w.datasource_id}`, strength: "strong" });
  if (w.permission_id) graph.edges.push({ from: `widget:${w.id}`, to: `permission:${w.permission_id}`, strength: "strong" });
}
for (const p of pages) {
  for (const cap of p.capabilities_required || []) graph.edges.push({ from: `page:${p.id}`, to: `capability:${cap}`, strength: "strong" });
}
for (const t of tokens) {
  graph.edges.push({ from: `theme:base`, to: `token:${t.token_key}`, strength: "weak" });
}

const outPath = `./runtime/manifests/dependency_graph.${releaseId}.json`;
writeFileSync(outPath, JSON.stringify(graph, null, 2) + "\n", "utf-8");
console.log(`Dependency graph written: ${outPath}`);
