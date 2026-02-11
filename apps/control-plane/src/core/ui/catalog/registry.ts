export type CatalogKind = "layout" | "widget" | "table" | "panel" | "state" | "chart" | "page";
export type CatalogSurface = "app" | "cp" | "shared";
export type CatalogState = "default" | "loading" | "empty" | "error" | "accessDenied" | "safeMode" | "readOnly";

export type CatalogEntry = {
  id: string;
  name: string;
  kind: CatalogKind;
  app: CatalogSurface;
  description?: string;
  tags?: string[];
  supports?: CatalogState[];
  render: (host: HTMLElement, ctx: { state: CatalogState }) => void;
};

const REGISTRY: CatalogEntry[] = [];

export function registerComponent(entry: CatalogEntry): void {
  if (!entry || !entry.id) return;
  if (REGISTRY.some((item) => item.id === entry.id)) return;
  REGISTRY.push(entry);
}

export function listCatalogEntries(surface: CatalogSurface): CatalogEntry[] {
  return REGISTRY.filter((entry) => entry.app === surface || entry.app === "shared");
}
