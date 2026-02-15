import { readJson, writeJson, writeText, sha256 } from "./utils.mjs";
import { validateOrThrow } from "../../core/contracts/schema/validate.mjs";

export function compileTokens({ ssotDir, outDir, releaseId }) {
  const tokens = readJson(`${ssotDir}/design/design_tokens.json`);
  const tokenSets = readJson(`${ssotDir}/design/token_sets.json`);
  const themes = readJson(`${ssotDir}/design/themes.json`);
  const layers = readJson(`${ssotDir}/design/theme_layers.json`);
  const typographySets = readJson(`${ssotDir}/design/typography_sets.json`);
  const densityProfiles = readJson(`${ssotDir}/design/density_profiles.json`);
  const motionSets = readJson(`${ssotDir}/design/motion_sets.json`);

  for (const t of tokens) validateOrThrow("design_token.v1", t, "design_tokens");
  for (const s of tokenSets) validateOrThrow("token_set.v1", s, "token_sets");
  for (const th of themes) validateOrThrow("theme.v1", th, "themes");
  for (const t of typographySets) validateOrThrow("typography_set.v1", t, "typography_sets");
  for (const d of densityProfiles) validateOrThrow("density_profile.v1", d, "density_profiles");
  for (const m of motionSets) validateOrThrow("motion_set.v1", m, "motion_sets");
  validateOrThrow("array_of_objects.v1", layers, "theme_layers");

  const runtimeLayer = layers.find((l) => l.layer === "runtime") || {};
  const activeThemeId = runtimeLayer.active_theme_id || themes[0]?.theme_id || "";
  const activeThemeVariant = runtimeLayer.active_theme_variant || "";
  const activeDensityId = runtimeLayer.active_density_id || densityProfiles[0]?.density_id || "";
  const activeTypographyId = runtimeLayer.active_typography_id || typographySets[0]?.typography_id || "";
  const activeMotionId = runtimeLayer.active_motion_id || motionSets[0]?.motion_id || "";

  const tokenMap = new Map(tokens.map((t) => [t.token_key, { ...t }]));
  const applyOverrides = (overrides) => {
    for (const o of overrides || []) {
      if (!o?.token_key) continue;
      const base = tokenMap.get(o.token_key) || { token_key: o.token_key, token_group: "custom", type: "custom", constraints: {}, token_version: "v1" };
      tokenMap.set(o.token_key, { ...base, value: o.value, units: o.units ?? base.units ?? "" });
    }
  };

  const themeLayer = layers.find((l) => l.theme_id === activeThemeId && (!activeThemeVariant || l.variant === activeThemeVariant)) ||
    layers.find((l) => l.theme_id === activeThemeId) ||
    null;
  applyOverrides(themeLayer?.token_overrides);

  const density = densityProfiles.find((d) => d.density_id === activeDensityId);
  applyOverrides(density?.overrides);

  const typography = typographySets.find((t) => t.typography_id === activeTypographyId);
  applyOverrides(typography?.overrides);

  const motion = motionSets.find((m) => m.motion_id === activeMotionId);
  applyOverrides(motion?.overrides);

  const themeManifest = {
    release_id: releaseId,
    tokens,
    token_sets: tokenSets,
    themes,
    layers,
    typography_sets: typographySets,
    density_profiles: densityProfiles,
    motion_sets: motionSets,
    active_theme_id: activeThemeId,
    active_theme_variant: activeThemeVariant,
    active_density_id: activeDensityId,
    active_typography_id: activeTypographyId,
    active_motion_id: activeMotionId,
    available_themes: themes.map((t) => t.theme_id),
    theme_variants: layers.filter((l) => l.theme_id && l.variant)
  };

  const cssVars = Array.from(tokenMap.values())
    .map((t) => `--${t.token_key}: ${String(t.value)}${t.units || ""};`)
    .join("\n");
  const cssText = `:root{\n${cssVars}\n}`;
  const cssChecksum = sha256(cssText.replace(/\r\n/g, "\n"));
  themeManifest.css_checksum = cssChecksum;

  writeJson(`${outDir}/theme_manifest.${releaseId}.json`, themeManifest);
  validateOrThrow("theme_manifest.v1", themeManifest, "theme_manifest");
  const cssOutDir = outDir.includes("/platform/runtime/manifests")
    ? outDir.replace(/\/platform\/runtime\/manifests$/, "/platform/runtime/build_artifacts")
    : outDir.includes("/runtime/manifests")
      ? outDir.replace(/\/runtime\/manifests$/, "/platform/runtime/build_artifacts")
      : outDir.endsWith("/manifests")
        ? outDir.replace(/\/manifests$/, "/build_artifacts")
        : outDir;
  writeText(`${cssOutDir}/theme_vars.${releaseId}.css`, cssText);

  return themeManifest;
}
