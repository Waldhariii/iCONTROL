import { readJson, writeJson } from "./utils.mjs";
import { validateOrThrow } from "../../core/contracts/schema/validate.mjs";

function autoRoutesFromPages(pages) {
  return pages.map((p, idx) => {
    const prefix = p.surface === "cp" ? "/cp" : "";
    return {
      route_id: `route:${p.id}`,
      surface: p.surface,
      path: `${prefix}/${p.slug}`,
      page_id: p.id,
      guard_pack_id: "guard:default",
      flag_gate_id: "flag:default",
      entitlement_gate_id: "entitlement:default",
      priority: 100 + idx,
      canonical: true,
      aliases: [],
      deprecation_date: "",
      redirect_to: ""
    };
  });
}

export function compileRoutes({ ssotDir, outDir, releaseId }) {
  const routeSpecs = readJson(`${ssotDir}/studio/routes/route_specs.json`);
  const routeAliases = readJson(`${ssotDir}/studio/routes/route_aliases.json`);
  const pages = readJson(`${ssotDir}/studio/pages/page_definitions.json`);
  for (const r of routeSpecs) validateOrThrow("route_spec.v1", r, "route_specs");
  for (const p of pages) validateOrThrow("page_definition.v1", p, "page_definitions");

  const routes = routeSpecs.length > 0 ? routeSpecs : autoRoutesFromPages(pages);
  for (const r of routes) validateOrThrow("route_spec.v1", r, "routes");
  const routeCatalog = {
    release_id: releaseId,
    routes,
    aliases: routeAliases
  };
  writeJson(`${outDir}/route_catalog.${releaseId}.json`, routeCatalog);
  validateOrThrow("route_catalog.v1", routeCatalog, "route_catalog");
  return routeCatalog;
}
