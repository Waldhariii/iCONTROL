/**
 * Phase6 Move4: CP navigation is 100% catalog-driven.
 * - No hardcoded surface arrays
 * - Derives items from getCpSurfaceRegistryCatalogDriven()
 * - Deterministic sorting
 */
import type { CpSurfaceCatalogEntry } from "../ports/cpSurfaceRegistry.catalog";
import { getCpSurfaceRegistryCatalogDriven } from "../ports/cpSurfaceRegistry.catalog";

export type CpNavItem = {
  id: string;
  route: string;
  label: string;
};

function titleize(s: string): string {
  const core = s.startsWith("cp.") ? s.slice(3) : s;
  return core
    .split(".")
    .filter(Boolean)
    .map(x => x.replace(/[_-]+/g, " ").trim())
    .map(x => x.charAt(0).toUpperCase() + x.slice(1))
    .join(" ");
}

function uniqByKey<T>(arr: T[], key: (t: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const x of arr) {
    const k = key(x);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x);
  }
  return out;
}

export async function getCpNavCatalogDriven(): Promise<CpNavItem[]> {
  const reg = await getCpSurfaceRegistryCatalogDriven();
  const entries: CpSurfaceCatalogEntry[] =
    Array.isArray((reg as any)?.entries) ? (reg as any).entries
    : Array.isArray(reg as any) ? (reg as any)
    : [];

  const items = entries
    .filter(e => typeof (e as any)?.surfaceId === "string")
    .map(e => {
      const id = (e as any).surfaceId as string;
      const route = `/cp/#/${id.replace(/^cp\./, "").replace(/\./g, "-")}`;
      return { id, route, label: titleize(id) };
    });

  const deduped = uniqByKey(items, (x) => `${x.id}::${x.route}`);
  deduped.sort((a, b) => (a.label + a.route).localeCompare(b.label + b.route));
  return deduped;
}

// Phase9: operator-only CP nav entry (read-only)
export const CP_NAV_OPERATOR_ENTRY = {
  id: "cp.operator",
  label: "Operator",
  href: "/cp/#/operator",
  kind: "operator" as const,
};
