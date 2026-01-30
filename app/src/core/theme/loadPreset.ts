import type { ThemeTokens } from "./themeTokens";

/**
 * Loader simple: import JSON preset.
 * NOTE: Vite supporte l'import JSON. Sinon, convertir en TS module plus tard.
 */
export async function loadThemePreset(presetPath: string): Promise<ThemeTokens> {
  // presetPath ex: "/src/core/theme/presets/cp-dashboard-charcoal.dark.json"
  const mod = await import(/* @vite-ignore */ presetPath);
  return (mod?.default ?? mod) as ThemeTokens;
}
