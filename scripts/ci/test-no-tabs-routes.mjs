/**
 * Phase AA: ensure no new routes are created for tabs (tabs are sections, not routes).
 */
import { readFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { execSync } from "child_process";
import { createTempSsot } from "./test-utils.mjs";

function readJson(p) {
  return JSON.parse(readFileSync(p, "utf-8"));
}

const temp = createTempSsot();
const ssotDir = temp.ssotDir;
const outDir = join(dirname(dirname(ssotDir)), "runtime", "manifests");
mkdirSync(outDir, { recursive: true });

execSync("node scripts/ci/compile.mjs dev-001 dev", {
  stdio: "inherit",
  env: { ...process.env, SSOT_DIR: ssotDir, OUT_DIR: outDir }
});

const routeCatalog = readJson(join(outDir, "route_catalog.dev-001.json"));
const navSpecs = readJson(join(ssotDir, "studio/nav/nav_specs.json"));
const sectionKeys = new Set();
for (const n of navSpecs) {
  if (n.type === "section" && n.section_key) sectionKeys.add(n.section_key);
}

const routes = routeCatalog.routes || [];
const tabRoutes = routes.filter((r) => {
  const segs = (r.path || "").split("/").filter(Boolean);
  const last = segs[segs.length - 1];
  return last && sectionKeys.has(last);
});
if (tabRoutes.length > 0) {
  throw new Error(`Tabs must not be routes. Found: ${tabRoutes.map((r) => r.path).join(", ")}`);
}

console.log("No tabs routes PASS", { totalRoutes: routes.length, sectionKeys: sectionKeys.size });

temp.cleanup();
