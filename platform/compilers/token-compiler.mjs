import { readJson, writeJson, writeText } from "./utils.mjs";
import { validateOrThrow } from "../../core/contracts/schema/validate.mjs";

export function compileTokens({ ssotDir, outDir, releaseId }) {
  const tokens = readJson(`${ssotDir}/design/design_tokens.json`);
  const themes = readJson(`${ssotDir}/design/themes.json`);
  const layers = readJson(`${ssotDir}/design/theme_layers.json`);

  for (const t of tokens) validateOrThrow("design_token.v1", t, "design_tokens");
  for (const th of themes) validateOrThrow("theme.v1", th, "themes");
  validateOrThrow("array_of_objects.v1", layers, "theme_layers");

  const themeManifest = {
    release_id: releaseId,
    tokens,
    themes,
    layers
  };

  const cssVars = tokens
    .map((t) => `--${t.token_key}: ${String(t.value)}${t.units || ""};`)
    .join("\n");

  writeJson(`${outDir}/theme_manifest.${releaseId}.json`, themeManifest);
  validateOrThrow("theme_manifest.v1", themeManifest, "theme_manifest");
  const cssOutDir = outDir.includes("/platform/runtime/manifests")
    ? outDir.replace(/\/platform\/runtime\/manifests$/, "/platform/runtime/build_artifacts")
    : outDir.replace(/\/runtime\/manifests$/, "/platform/runtime/build_artifacts");
  writeText(`${cssOutDir}/theme_vars.${releaseId}.css`, `:root{\n${cssVars}\n}`);

  return themeManifest;
}
