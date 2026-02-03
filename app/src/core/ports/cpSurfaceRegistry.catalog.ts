import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

export type CpSurfaceCatalogEntry = Readonly<{
  moduleId: string;
  surfaceId: string;               // normalized: cp.<name>
  routes: readonly string[];        // CP-scoped route hints (best-effort)
  capabilities: readonly string[];  // from module caps (best-effort)
}>;

type CatalogModule = {
  id: string;
  surfaces?: unknown;
  routes?: unknown;
  capabilities?: unknown;
};

type ModuleCatalog = {
  modules: CatalogModule[];
};

function repoRoot(): string {
  return execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
}

function readJson<T>(p: string): T {
  return JSON.parse(fs.readFileSync(p, "utf8")) as T;
}

function uniqSorted(xs: string[]): string[] {
  return Array.from(new Set(xs)).sort((a, b) => a.localeCompare(b));
}

function toStrArray(x: unknown): string[] {
  return Array.isArray(x) ? x.filter((v) => typeof v === "string") as string[] : [];
}

function normalizeCpSurfaceId(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;

  // Accept: "cp.users", "cp_users", "CP_USERS", "users" (only if clearly CP-scoped elsewhere)
  if (s.startsWith("cp.")) return s;
  if (s.startsWith("cp_")) return "cp." + s.slice(3);
  if (/^cp\-[a-z0-9._-]+$/i.test(s)) return "cp." + s.slice(3).replace(/[-_]/g, ".");
  if (/^cp[a-z0-9._-]+$/i.test(s) && s.toLowerCase().startsWith("cp")) return "cp." + s.slice(2).replace(/[-_]/g, ".");
  if (/^cp_[a-z0-9._-]+$/i.test(s)) return "cp." + s.slice(3).replace(/[-_]/g, ".");
  if (/^cp\.[a-z0-9._-]+$/i.test(s)) return s;

  // If value is like "CP_USERS" -> cp.users
  if (/^[A-Z0-9_]+$/.test(s) && s.startsWith("CP_")) return "cp." + s.slice(3).toLowerCase().replace(/_/g, ".");
  return null;
}

function extractCpSurfaceFromCpHashRoute(route: string): string | null {
  // common pattern: "/cp/#/users" or "cp/#/users" -> surface = "cp.users"
  const r = route.trim();
  const m = r.match(/\/cp\/#\/([a-z0-9._-]+)/i) || r.match(/cp\/#\/([a-z0-9._-]+)/i);
  if (!m) return null;
  const seg = (m[1] || "").split("/")[0].trim();
  if (!seg) return null;
  return "cp." + seg.toLowerCase().replace(/[_-]/g, ".");
}

function isCpRoute(r: string): boolean {
  const x = r.toLowerCase();
  return x.includes("/cp/") || x.includes("cp/#/") || x.startsWith("/cp") || x.startsWith("cp/");
}

export function buildCpSurfaceRegistryFromCatalog(): readonly CpSurfaceCatalogEntry[] {
  const root = repoRoot();
  const catPath = path.join(root, "config", "ssot", "MODULE_CATALOG.json");
  if (!fs.existsSync(catPath)) throw new Error("ERR_MODULE_CATALOG_MISSING");

  const cat = readJson<ModuleCatalog>(catPath);
  if (!cat || !Array.isArray(cat.modules) || cat.modules.length === 0) throw new Error("ERR_MODULE_CATALOG_INVALID");

  const out: CpSurfaceCatalogEntry[] = [];

  for (const m of cat.modules) {
    const moduleId = (m?.id ?? "").toString().trim();
    if (!moduleId) continue;

    const surfacesRaw = toStrArray(m.surfaces);
    const routesRaw = toStrArray(m.routes);
    const capsRaw = toStrArray(m.capabilities);

    const cpRoutes = uniqSorted(routesRaw.filter(isCpRoute));
    const caps = uniqSorted(capsRaw);

    // 1) Prefer explicit CP surfaces if present
    const normalizedFromSurfaces = surfacesRaw
      .map((s) => normalizeCpSurfaceId(s))
      .filter((x): x is string => Boolean(x))
      .map((s) => s.replace(/^cp\./, "cp."))
      .map((s) => "cp." + s.slice(3).toLowerCase().replace(/[_-]/g, "."));

    // 2) If none, derive from routes like /cp/#/<surface>
    const derivedFromRoutes = cpRoutes
      .map((r) => extractCpSurfaceFromCpHashRoute(r))
      .filter((x): x is string => Boolean(x));

    const surfaces = uniqSorted([...normalizedFromSurfaces, ...derivedFromRoutes]);

    for (const surfaceId of surfaces) {
      out.push({
        moduleId,
        surfaceId,
        routes: cpRoutes,
        capabilities: caps,
      });
    }
  }

  const final = out.sort((a, b) => (a.surfaceId + "::" + a.moduleId).localeCompare(b.surfaceId + "::" + b.moduleId));

  // High-signal guard: Move3 expects CP surfaces exist
  if (final.length === 0) {
    // This is a data/config problem (catalog missing CP surfaces/routes), not a code issue.
    throw new Error("ERR_CP_SURFACE_REGISTRY_EMPTY");
  }

  return final;
}

export function listCpSurfaceIdsFromCatalog(): readonly string[] {
  return uniqSorted(buildCpSurfaceRegistryFromCatalog().map((e) => e.surfaceId));
}

export async function getCpSurfaceRegistryCatalogDriven(): Promise<{
  surfaces: readonly string[];
  entries: readonly CpSurfaceCatalogEntry[];
}> {
  const entries = buildCpSurfaceRegistryFromCatalog();
  return {
    surfaces: listCpSurfaceIdsFromCatalog(),
    entries,
  };
}
