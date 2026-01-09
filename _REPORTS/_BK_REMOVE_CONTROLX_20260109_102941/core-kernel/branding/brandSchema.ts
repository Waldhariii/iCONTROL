import type { Brand } from "./brandTypes";

/**
 * Validation légère (runtime) sans dépendances.
 * But: éviter qu’un branding invalide casse le boot.
 */
export function validateBrand(input: any): { ok: true; value: Brand; warnings: string[] } | { ok: false; warnings: string[] } {
  const w: string[] = [];
  const v = (input && typeof input === "object") ? input : {};

  const s = (x: any) => (typeof x === "string" ? x.trim() : "");
  const APP_DISPLAY_NAME = s(v.APP_DISPLAY_NAME);
  const TENANT_ID = s(v.TENANT_ID);
  const THEME_MODE = s(v.THEME_MODE) as any;
  const ACCENT_COLOR = s(v.ACCENT_COLOR);

  if (!APP_DISPLAY_NAME) w.push("ERR_BRAND_INVALID: APP_DISPLAY_NAME missing/empty");
  if (!TENANT_ID || !/^[a-z0-9][a-z0-9\-]+$/.test(TENANT_ID)) w.push("ERR_BRAND_INVALID: TENANT_ID invalid");
  if (!["dark","light","auto"].includes(THEME_MODE)) w.push("ERR_BRAND_INVALID: THEME_MODE invalid");
  if (!/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(ACCENT_COLOR)) w.push("ERR_BRAND_INVALID: ACCENT_COLOR invalid");

  const out: Brand = {
    APP_DISPLAY_NAME: APP_DISPLAY_NAME || "iCONTROL",
    APP_SHORT_NAME: s(v.APP_SHORT_NAME) || "iCONTROL",
    LEGAL_NAME: s(v.LEGAL_NAME) || APP_DISPLAY_NAME || "iCONTROL",
    TENANT_ID: TENANT_ID || "icontrol-default",
    TITLE_SUFFIX: s(v.TITLE_SUFFIX) || "",
    THEME_MODE: (["dark","light","auto"].includes(THEME_MODE) ? THEME_MODE : "dark"),
    ACCENT_COLOR: ACCENT_COLOR || "#6D28D9",
    LOGO_PRIMARY: s(v.LOGO_PRIMARY) || "",
    LOGO_COMPACT: s(v.LOGO_COMPACT) || ""
  };

  if (w.length) return { ok: false, warnings: w };
  return { ok: true, value: out, warnings: [] };
}
