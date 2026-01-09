import type { BrandResolved, Brand, BrandSource } from "./brandTypes";
import { validateBrand } from "./brandSchema";

/**
 * Brand Service V1
 * Source order:
 *  1) localStorage override (icontrol_brand_v1) — optional, future UI settings
 *  2) env (Vite import.meta.env.*)
 *  3) embedded default object (kept safe)
 *
 * Note: We do NOT use folder names as identifiers. TENANT_ID is stable.
 */

const LS_KEY = "icontrol_brand_v1";

const FALLBACK: Brand = {
  APP_DISPLAY_NAME: "iCONTROL",
  APP_SHORT_NAME: "iCONTROL",
  LEGAL_NAME: "iCONTROL",
  TENANT_ID: "icontrol-default",
  TITLE_SUFFIX: "",
  THEME_MODE: "dark",
  ACCENT_COLOR: "#6D28D9",
  LOGO_PRIMARY: "",
  LOGO_COMPACT: ""
};

function readLocalOverride(): any | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readEnv(): any {
  // Vite env: import.meta.env
  const e: any = (typeof import.meta !== "undefined" && (import.meta as any).env) ? (import.meta as any).env : {};
  const pick = (k: string) => (typeof e[k] === "string" ? e[k] : "");
  return {
    APP_DISPLAY_NAME: pick("VITE_APP_DISPLAY_NAME"),
    APP_SHORT_NAME: pick("VITE_APP_SHORT_NAME"),
    LEGAL_NAME: pick("VITE_LEGAL_NAME"),
    TENANT_ID: pick("VITE_TENANT_ID"),
    TITLE_SUFFIX: pick("VITE_TITLE_SUFFIX"),
    THEME_MODE: pick("VITE_THEME_MODE"),
    ACCENT_COLOR: pick("VITE_ACCENT_COLOR"),
    LOGO_PRIMARY: pick("VITE_LOGO_PRIMARY"),
    LOGO_COMPACT: pick("VITE_LOGO_COMPACT")
  };
}

function mergeClean(a: any, b: any): any {
  const out: any = { ...(a || {}) };
  for (const k of Object.keys(b || {})) {
    const v = b[k];
    if (typeof v === "string" && v.trim() === "") continue;
    if (v === undefined || v === null) continue;
    out[k] = v;
  }
  return out;
}

export function getBrandResolved(): BrandResolved {
  const warnings: string[] = [];

  const local = readLocalOverride();
  if (local) {
    const res = validateBrand(local);
    if (res.ok) return { brand: res.value, source: "override", warnings };
    warnings.push(...res.warnings);
    // fall through
  }

  const env = readEnv();
  const candidate = mergeClean(FALLBACK, env);
  const res2 = validateBrand(candidate);
  if (res2.ok) return { brand: res2.value, source: "env", warnings };

  warnings.push(...res2.warnings);
  return { brand: FALLBACK, source: "fallback", warnings };
}

export function getBrand(): Brand {
  return getBrandResolved().brand;
}

export function setBrandLocalOverride(patch: Partial<Brand>): { ok: true } | { ok: false; warnings: string[] } {
  const current = readLocalOverride() || {};
  const next = mergeClean(current, patch);
  const v = validateBrand(mergeClean(FALLBACK, next));
  if (!v.ok) return { ok: false, warnings: v.warnings };
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(next));
    return { ok: true };
  } catch (e: any) {
    return { ok: false, warnings: ["ERR_BRAND_WRITE_FAILED: " + String(e)] };
  }
}

export function clearBrandLocalOverride(): void {
  try { localStorage.removeItem(LS_KEY); } catch {}
}
