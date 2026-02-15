import { execSync } from "child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { createTempSsot } from "./test-utils.mjs";

const temp = createTempSsot();
const outDir = join(dirname(temp.ssotDir), "manifests");
mkdirSync(outDir, { recursive: true });

const releaseId = "density-compact-001";

try {
  const themeLayersPath = join(temp.ssotDir, "design", "theme_layers.json");
  const layers = JSON.parse(readFileSync(themeLayersPath, "utf-8"));
  const runtime = layers.find((l) => l.layer === "runtime");
  if (runtime) runtime.active_density_id = "density:compact";
  writeFileSync(themeLayersPath, JSON.stringify(layers, null, 2));

  execSync(`node scripts/ci/compile.mjs ${releaseId} dev`, {
    stdio: "inherit",
    env: { ...process.env, SSOT_DIR: temp.ssotDir, OUT_DIR: outDir }
  });

  const manifest = JSON.parse(readFileSync(join(outDir, `platform_manifest.${releaseId}.json`), "utf-8"));
  if (manifest.themes?.active_density_id !== "density:compact") throw new Error("Active density not compact");

  const cssDir = outDir.includes("/runtime/manifests")
    ? outDir.replace(/\/runtime\/manifests$/, "/platform/runtime/build_artifacts")
    : outDir.replace(/\/manifests$/, "/build_artifacts");
  const cssPath = join(cssDir, `theme_vars.${releaseId}.css`);
  if (!existsSync(cssPath)) throw new Error("theme_vars css missing");
  const css = readFileSync(cssPath, "utf-8");
  if (!css.includes("--space.1: 3px;")) throw new Error("Compact density overrides not applied");

  console.log("Density compact PASS");
} finally {
  temp.cleanup();
}
