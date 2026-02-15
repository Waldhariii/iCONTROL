import { execSync } from "child_process";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { createTempSsot } from "./test-utils.mjs";

const temp = createTempSsot();
const outDir = join(dirname(temp.ssotDir), "manifests");
mkdirSync(outDir, { recursive: true });

const activeRelease = "theme-active-001";
const previewRelease = "theme-preview-001";

try {
  execSync(`node scripts/ci/compile.mjs ${activeRelease} dev`, {
    stdio: "inherit",
    env: { ...process.env, SSOT_DIR: temp.ssotDir, OUT_DIR: outDir }
  });
  const activeManifest = JSON.parse(readFileSync(join(outDir, `platform_manifest.${activeRelease}.json`), "utf-8"));
  const activeTheme = activeManifest.themes?.active_theme_id || "";

  const themeLayersPath = join(temp.ssotDir, "design", "theme_layers.json");
  const layers = JSON.parse(readFileSync(themeLayersPath, "utf-8"));
  const runtime = layers.find((l) => l.layer === "runtime");
  if (runtime) runtime.active_theme_id = "theme:graphite-high-contrast";
  writeFileSync(themeLayersPath, JSON.stringify(layers, null, 2));

  execSync(`node scripts/ci/compile.mjs ${previewRelease} dev`, {
    stdio: "inherit",
    env: { ...process.env, SSOT_DIR: temp.ssotDir, OUT_DIR: outDir }
  });
  const previewManifest = JSON.parse(readFileSync(join(outDir, `platform_manifest.${previewRelease}.json`), "utf-8"));
  const previewTheme = previewManifest.themes?.active_theme_id || "";

  if (!activeTheme) throw new Error("Missing active theme in active manifest");
  if (previewTheme !== "theme:graphite-high-contrast") throw new Error("Preview theme not applied");

  console.log("Theme switch preview PASS");
} finally {
  temp.cleanup();
}
