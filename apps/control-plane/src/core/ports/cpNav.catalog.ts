import { getCpSurfaceRegistryCatalogDriven } from "./cpSurfaceRegistry.catalog";
import { loadModuleCatalog } from "../ssot/moduleCatalogLoader";

export type CpNavEntry = Readonly<{
  id: string;
  labelKey: string;
  route: string;
}>;

function stableSort(a: string, b: string): number {
  return a.localeCompare(b);
}

function toLabelKey(surfaceId: string): string {
  return `nav.${surfaceId}`;
}

function toDefaultRouteFromSurface(surfaceId: string): string {
  const seg = surfaceId.replace(/^cp\./, "").replace(/\./g, "-");
  return `/cp/#/${seg}`;
}

export async function getCpNavCatalogDriven(): Promise<readonly CpNavEntry[]> {
  const reg = await getCpSurfaceRegistryCatalogDriven();
  const allowed = Array.isArray(reg?.surfaces) ? reg.surfaces : [];
  if (allowed.length === 0) return [];

  const cat = await loadModuleCatalog();
  const allCatalogSurfaces = new Set<string>();
  for (const m of cat.modules || []) {
    for (const s of (m.surfaces || [])) allCatalogSurfaces.add(s);
  }

  const final = allowed
    .filter((s) => typeof s === "string" && s.startsWith("cp."))
    .filter((s) => allCatalogSurfaces.has(s))
    .sort(stableSort)
    .map((surfaceId) => ({
      id: surfaceId,
      labelKey: toLabelKey(surfaceId),
      route: toDefaultRouteFromSurface(surfaceId),
    })) as readonly CpNavEntry[];

  return final;
}
