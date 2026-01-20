/**
 * ICONTROL_LOGO_MANAGER_STUB_V1
 * Stub minimal pour unblock bundling/tests.
 * Remplacer par une implémentation réelle (branding runtime-config, theme assets, cache) avant prod.
 */

export type LogoVariant = "light" | "dark" | "mono";

export interface LogoSpec {
  variant?: LogoVariant;
  alt?: string;
  // URL absolue ou relative (dist) — ici stub
  url?: string;
}

export function getLogoSpec(_opts: { variant?: LogoVariant } = {}): LogoSpec {
  // Stub: retourner un objet vide pour éviter toute dépendance runtime.
  return { variant: _opts.variant ?? "light", alt: "iCONTROL", url: "" };
}

// AUTO-STUB export for build unblock
export function updateAllLogos(..._args: any[]): any { return undefined; }

// AUTO-STUB export for build unblock
export function setupLogoThemeObserver(..._args: any[]): any { return undefined; }
