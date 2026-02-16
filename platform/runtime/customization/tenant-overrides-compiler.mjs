/**
 * Level 11: Tenant overrides compiler.
 * Sources: ssot/tenancy/tenant_overrides.json, optional ssot/tenant_overrides/
 * Outputs ONLY under runtime/. Respects IsolationGate and DataGovCoverageGate.
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";

const root = process.env.SSOT_DIR || join(process.cwd(), "platform", "ssot");
const resolvedRoot = root.startsWith("/") ? root : join(process.cwd(), root);
const runtimeDir = join(process.cwd(), "runtime");
const outDir = join(runtimeDir, "customization");

function readJson(path) {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf-8"));
}

const overridesPath = join(resolvedRoot, "tenancy", "tenant_overrides.json");
const overridesList = readJson(overridesPath) || [];

const overridesDir = join(resolvedRoot, "tenant_overrides");
let extra = {};
if (existsSync(overridesDir)) {
  for (const f of readdirSync(overridesDir).filter((x) => x.endsWith(".json"))) {
    const key = f.replace(".json", "");
    extra[key] = readJson(join(overridesDir, f));
  }
}

const compiled = {
  generated_at: new Date().toISOString(),
  source: overridesPath,
  overrides: overridesList,
  extra,
  governance_note: "IsolationGate and DataGovCoverageGate apply; no override may bypass governance."
};

mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "compiled_overrides.json");
writeFileSync(outPath, JSON.stringify(compiled, null, 2) + "\n", "utf-8");

console.log("Compiled tenant overrides to runtime/customization/compiled_overrides.json");
