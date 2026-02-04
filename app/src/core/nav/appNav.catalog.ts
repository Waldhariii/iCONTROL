import { loadModuleCatalog } from "../ssot/moduleCatalogLoader";

export type AppNavItem = { id: string; title: string; route: string; };

export async function getAppNavCatalogDriven(): Promise<AppNavItem[]> {
  const cat = loadModuleCatalog();
  const routes = new Set<string>();
  for (const m of (await cat).modules) {
    for (const r of (m.routes || [])) {
      if (typeof r === "string" && r.startsWith("/") && !r.startsWith("/cp")) routes.add(r);
    }
  }
  return Array.from(routes)
    .sort((a, b) => a.localeCompare(b))
    .map((route) => ({ id: "appnav:" + route, title: route, route }));
}
