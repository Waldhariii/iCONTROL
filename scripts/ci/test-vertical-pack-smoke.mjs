/**
 * Business Surfaces: Vertical pack smoke — temp SSOT overlay with extension pack, compile, assert route.
 */
import { mkdirSync, rmSync, readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

function repoRoot() {
  const here = fileURLToPath(new URL(".", import.meta.url));
  return join(here, "..", "..");
}

function createTempDir(prefix) {
  const root = join(process.cwd(), "runtime", "reports", "tmp");
  mkdirSync(root, { recursive: true });
  const d = join(root, `${prefix}-${Date.now()}`);
  mkdirSync(d, { recursive: true });
  return d;
}

function loadJson(p) {
  if (!existsSync(p)) return [];
  const raw = readFileSync(p, "utf-8").trim();
  if (!raw) return [];
  const j = JSON.parse(raw);
  return Array.isArray(j) ? j : [];
}

function mergeArrays(basePath, packPath, outPath) {
  const base = existsSync(basePath) ? loadJson(basePath) : [];
  const pack = existsSync(packPath) ? loadJson(packPath) : [];
  const merged = [...base, ...pack];
  writeFileSync(outPath, JSON.stringify(merged, null, 2) + "\n", "utf-8");
}

function main() {
  const ROOT = repoRoot();
  const SSOT_SRC = join(ROOT, "platform", "ssot");
  const OUT_DIR = createTempDir("out-vertical-pack");
  const TMP_SSOT = createTempDir("ssot-vertical-pack");

  const VERTICAL = process.env.VERTICAL || "extermination";
  const PACK_ROOT = join(ROOT, "extensions", "official", VERTICAL, "ssot", "packs", `${VERTICAL}_v1`);

  if (!existsSync(PACK_ROOT)) {
    console.error("Pack root missing:", PACK_ROOT);
    process.exit(1);
  }

  // 1) Copy base SSOT
  execSync(`cp -R "${SSOT_SRC}/." "${TMP_SSOT}"`, { stdio: "pipe" });

  // 2) Merge pack arrays into TMP_SSOT (concat pack items to base)
  const mergeFiles = [
    ["studio/pages/page_definitions.json", "studio/pages/page_definitions.json"],
    ["studio/pages/page_instances.json", "studio/pages/page_instances.json"],
    ["studio/routes/route_specs.json", "studio/routes/route_specs.json"],
    ["studio/nav/nav_specs.json", "studio/nav/nav_specs.json"],
    ["studio/workflows/workflow_definitions.json", "studio/workflows/workflow_definitions.json"],
    ["data/query_catalog.json", "data/query_catalog.json"]
  ];
  for (const [relPath] of mergeFiles) {
    const basePath = join(SSOT_SRC, relPath);
    const packPath = join(PACK_ROOT, relPath);
    const outPath = join(TMP_SSOT, relPath);
    if (existsSync(packPath)) {
      mkdirSync(join(outPath, ".."), { recursive: true });
      mergeArrays(basePath, packPath, outPath);
    }
  }
  if (existsSync(join(PACK_ROOT, "studio/widgets/widget_catalog.json"))) {
    const basePath = join(TMP_SSOT, "studio/widgets/widget_catalog.json");
    const packPath = join(PACK_ROOT, "studio/widgets/widget_catalog.json");
    mergeArrays(basePath, packPath, basePath);
  }
  if (existsSync(join(PACK_ROOT, "studio/widgets/widget_instances.json"))) {
    const basePath = join(TMP_SSOT, "studio/widgets/widget_instances.json");
    const packPath = join(PACK_ROOT, "studio/widgets/widget_instances.json");
    mergeArrays(basePath, packPath, basePath);
  }

  // 3) Validate + compile (temp only)
  execSync("node scripts/ci/validate-ssot.mjs", {
    stdio: "inherit",
    cwd: ROOT,
    env: { ...process.env, SSOT_DIR: TMP_SSOT }
  });

  execSync("node scripts/ci/compile.mjs dev-001 dev", {
    stdio: "inherit",
    cwd: ROOT,
    env: { ...process.env, SSOT_DIR: TMP_SSOT, OUT_DIR }
  });

  // 4) Sanity: compiled route_catalog contains /cp/vertical-home
  const routePath = join(OUT_DIR, "route_catalog.dev-001.json");
  if (!existsSync(routePath)) {
    console.error("FAIL: missing", routePath);
    process.exit(1);
  }
  const routeCatalog = JSON.parse(readFileSync(routePath, "utf-8"));
  const routes = routeCatalog?.routes || [];
  const has = routes.some((r) => r?.path === "/cp/vertical-home");
  if (!has) {
    console.error("FAIL: missing /cp/vertical-home in compiled routes");
    process.exit(1);
  }

  console.log("Vertical pack smoke PASS", { vertical: VERTICAL, out_dir: OUT_DIR });

  try {
    rmSync(TMP_SSOT, { recursive: true, force: true, maxRetries: 3 });
  } catch {}
  try {
    rmSync(OUT_DIR, { recursive: true, force: true, maxRetries: 3 });
  } catch {}
}

main();
