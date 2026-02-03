import fs from "node:fs";
import path from "node:path";

export type ModuleCatalogV1 = Readonly<{
  schema: string;
  generated_at_utc?: string;
  modules: readonly Readonly<{
    id: string;
    manifest: string;
    capabilities: string[];
    surfaces: string[];
    routes: string[];
  }>[];
}>;

function repoRoot(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const child = require("node:child_process");
    const out = child.execSync("git rev-parse --show-toplevel", { stdio: ["ignore", "pipe", "ignore"] });
    return String(out).trim();
  } catch {
    return path.resolve(process.cwd(), "..");
  }
}

export async function loadModuleCatalog(): Promise<ModuleCatalogV1> {
  const root = repoRoot();
  const p = path.join(root, "config", "ssot", "MODULE_CATALOG.json");
  const raw = fs.readFileSync(p, "utf8");
  return JSON.parse(raw) as ModuleCatalogV1;
}
