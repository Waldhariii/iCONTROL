import { readFileSync, writeFileSync } from "fs";
import { execSync } from "child_process";

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}

function removeById(list, ids) {
  const idSet = new Set(ids);
  return list.filter((x) => !idSet.has(x.id));
}

export function orchestrateDelete({ changesetId, releaseId }) {
  const cs = readJson(`./platform/ssot/changes/changesets/${changesetId}.json`);
  const deletes = (cs.ops || []).filter((o) => o.op === "delete_request");
  if (!deletes.length) throw new Error("No delete_request ops");

  for (const op of deletes) {
    const target = op.target;
    if (target.kind === "page_definition") {
      const pagesPath = "./platform/ssot/studio/pages/page_definitions.json";
      const pageVersionsPath = "./platform/ssot/studio/pages/page_instances.json";
      const pageBindingsPath = "./platform/ssot/studio/pages/page_bindings.json";
      const routesPath = "./platform/ssot/studio/routes/route_specs.json";
      const navPath = "./platform/ssot/studio/nav/nav_specs.json";
      const routeAliasesPath = "./platform/ssot/studio/routes/route_aliases.json";

      const pages = readJson(pagesPath);
      const pageVersions = readJson(pageVersionsPath);
      const pageBindings = readJson(pageBindingsPath);
      const routes = readJson(routesPath);
      const navSpecs = readJson(navPath);
      const routeAliases = readJson(routeAliasesPath);

      const pageId = target.ref;
      const removedRoutes = routes.filter((r) => r.page_id === pageId).map((r) => r.route_id);

      writeJson(pagesPath, pages.filter((p) => p.id !== pageId));
      writeJson(pageVersionsPath, pageVersions.filter((pv) => pv.page_id !== pageId));
      writeJson(pageBindingsPath, pageBindings.filter((pb) => pb.page_id !== pageId));
      writeJson(routesPath, routes.filter((r) => r.page_id !== pageId));
      writeJson(navPath, navSpecs.filter((n) => !removedRoutes.includes(n.route_id)));
      writeJson(routeAliasesPath, routeAliases.filter((a) => !removedRoutes.includes(a.route_id)));
    } else if (target.kind === "route_spec") {
      const routesPath = "./platform/ssot/studio/routes/route_specs.json";
      const navPath = "./platform/ssot/studio/nav/nav_specs.json";
      const routeAliasesPath = "./platform/ssot/studio/routes/route_aliases.json";
      const routes = readJson(routesPath);
      writeJson(routesPath, routes.filter((r) => r.route_id !== target.ref));
      const navSpecs = readJson(navPath);
      writeJson(navPath, navSpecs.filter((n) => n.route_id !== target.ref));
      const routeAliases = readJson(routeAliasesPath);
      writeJson(routeAliasesPath, routeAliases.filter((a) => a.route_id !== target.ref));
    } else if (target.kind === "widget_instance") {
      const widgetsPath = "./platform/ssot/studio/widgets/widget_instances.json";
      const widgets = readJson(widgetsPath);
      writeJson(widgetsPath, widgets.filter((w) => w.id !== target.ref));
    } else {
      throw new Error(`Unsupported delete kind: ${target.kind}`);
    }
  }

  execSync(`node scripts/ci/compile.mjs ${releaseId} dev`, { stdio: "inherit" });
  // rebuild graph and ensure no strong refs to deleted targets
  execSync(`node platform/runtime/dependency-graph/build-graph.mjs ${releaseId}`, { stdio: "inherit" });
  const graph = readJson(`./runtime/manifests/dependency_graph.${releaseId}.json`);
  for (const op of deletes) {
    const kindMap = {
      page_definition: "page",
      route_spec: "route",
      widget_instance: "widget"
    };
    const target = `${kindMap[op.target.kind] || op.target.kind}:${op.target.ref}`;
    const blockers = graph.edges.filter((e) => e.to === target && e.strength === "strong");
    if (blockers.length) {
      throw new Error(`Strong references prevent purge: ${target}`);
    }
  }

  execSync(`node platform/runtime/deletion/gc.mjs ${releaseId} --apply`, { stdio: "inherit" });
  const plan = {
    changeset_id: changesetId,
    release_id: releaseId,
    steps: ["disable", "depublish", "redirect", "purge", "snapshot", "audit", "drift_check"]
  };
  writeJson("./platform/runtime/deletion/delete_plan.json", plan);
}

const changesetId = process.argv[2];
const releaseId = process.argv[3] || "dev";
if (!changesetId) {
  console.error("Usage: orchestrator.mjs <changesetId> [releaseId]");
  process.exit(1);
}

orchestrateDelete({ changesetId, releaseId });
