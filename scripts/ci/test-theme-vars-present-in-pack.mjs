import { execSync } from "child_process";
import { existsSync, mkdirSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { createTempSsot } from "./test-utils.mjs";

const temp = createTempSsot();
const releaseId = `theme-pack-${Date.now()}`;
const outDir = join(dirname(temp.ssotDir), "manifests");
mkdirSync(outDir, { recursive: true });

try {
  execSync(`node scripts/ci/compile.mjs ${releaseId} dev`, {
    stdio: "inherit",
    env: { ...process.env, SSOT_DIR: temp.ssotDir, OUT_DIR: outDir }
  });

  const packDir = join(process.cwd(), "runtime", "reports", "packs", `THEME_PACK_TEST_${Date.now()}`);
  execSync(`node scripts/maintenance/generate-release-pack.mjs --release ${releaseId} --env dev --out ${packDir}`, {
    stdio: "inherit",
    env: { ...process.env, SSOT_DIR: temp.ssotDir, MANIFESTS_DIR: outDir }
  });

  const themeVars = join(packDir, "manifests", `theme_vars.${releaseId}.css`);
  if (!existsSync(themeVars)) throw new Error("theme_vars css missing in pack");

  const packJson = JSON.parse(readFileSync(join(packDir, "pack.json"), "utf-8"));
  const hasTheme = (packJson.checksums || []).some((c) => String(c.path || "").includes(`theme_vars.${releaseId}.css`));
  if (!hasTheme) throw new Error("pack.json checksums missing theme_vars");

  console.log("Theme vars present in pack PASS");
} finally {
  temp.cleanup();
}
