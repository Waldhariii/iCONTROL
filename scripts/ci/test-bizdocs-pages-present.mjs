/**
 * Phase AD: temp SSOT with bizdocs pages/routes/nav; activate modules, compile -> manifest, assert pages+routes+nav present, run-gates (Collision/Policy/Isolation/ActionPolicy/Binding/PerfBudget).
 */
import { execSync } from "child_process";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { createTempSsot } from "./test-utils.mjs";

const REQUIRED_PAGE_IDS = ["page:documents", "page:pdf_exports", "page:ocr_inbox", "page:accounting_sync"];
const REQUIRED_PATHS = ["/app/documents", "/app/pdf-exports", "/app/ocr-inbox", "/app/accounting-sync"];
const REQUIRED_NAV_KEYS = ["nav:bizdocs.documents", "nav:bizdocs.pdf_exports", "nav:bizdocs.ocr_inbox", "nav:bizdocs.accounting_sync"];
const BIZDOCS_MODULES = ["module:documents", "module:pdf_exports", "module:ocr_pipeline", "module:accounting_sync"];

const temp = createTempSsot();
const ssotDir = temp.ssotDir;
const outDir = join(dirname(dirname(ssotDir)), "runtime", "manifests");
mkdirSync(outDir, { recursive: true });

// Activate bizdocs modules in temp SSOT (tenant override)
const activationsPath = join(ssotDir, "modules", "module_activations.json");
const activations = JSON.parse(readFileSync(activationsPath, "utf-8"));
const existingIds = new Set(activations.map((a) => a.module_id));
for (const mid of BIZDOCS_MODULES) {
  if (!existingIds.has(mid)) {
    activations.push({ tenant_id: "tenant:default", module_id: mid, state: "active" });
    existingIds.add(mid);
  }
}
writeFileSync(activationsPath, JSON.stringify(activations, null, 2) + "\n");

execSync("node scripts/ci/compile.mjs dev-001 dev", {
  stdio: "inherit",
  env: { ...process.env, SSOT_DIR: ssotDir, OUT_DIR: outDir }
});

const manifestPath = join(outDir, "platform_manifest.dev-001.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));

const pages = manifest.pages?.pages || manifest.pages || [];
const pageIds = new Set(pages.map((p) => p.page_id || p.id));
for (const pid of REQUIRED_PAGE_IDS) {
  if (!pageIds.has(pid)) {
    throw new Error(`Manifest missing page: ${pid}`);
  }
}

const routes = manifest.routes?.routes || manifest.routes || [];
const paths = new Set(routes.map((r) => r.path));
for (const path of REQUIRED_PATHS) {
  if (!paths.has(path)) {
    throw new Error(`Manifest missing route path: ${path}`);
  }
}

const nav = manifest.nav?.nav_specs || manifest.nav_specs || manifest.nav || [];
const navIds = new Set(nav.map((n) => n.id));
for (const nid of REQUIRED_NAV_KEYS) {
  if (!navIds.has(nid)) {
    throw new Error(`Manifest missing nav entry: ${nid}`);
  }
}

execSync("node governance/gates/run-gates.mjs dev-001", {
  stdio: "inherit",
  env: { ...process.env, SSOT_DIR: ssotDir, MANIFESTS_DIR: outDir }
});

console.log("Bizdocs pages present + gates PASS", { pages: REQUIRED_PAGE_IDS, routes: REQUIRED_PATHS });
temp.cleanup();
