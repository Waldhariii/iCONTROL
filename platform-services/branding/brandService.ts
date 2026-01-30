import type { Brand, BrandResolved, BrandOverrideResult } from "../../core-kernel/contracts/BrandingPort";
import { getLogger } from "../../app/src/core/utils/logger";
import { isEnabled } from "../../app/src/policies/feature_flags.enforce";
import { createAuditHook } from "../../app/src/core/write-gateway/auditHook";
import { createLegacyAdapter } from "../../app/src/core/write-gateway/adapters/legacyAdapter";
import { createPolicyHook } from "../../app/src/core/write-gateway/policyHook";
import { createCorrelationId, createWriteGateway } from "../../app/src/core/write-gateway/writeGateway";
import { getTenantId } from "../../app/src/core/runtime/tenant";

/** WRITE_GATEWAY_WRITE_SURFACE — shadow scaffold (legacy-first; NO-OP adapter). */
const __wsLogger = getLogger("WRITE_GATEWAY_WRITE_SURFACE");
let __wsGateway: ReturnType<typeof createWriteGateway> | null = null;

function __resolveWsGateway() {
  if (__wsGateway) return __wsGateway;
  __wsGateway = createWriteGateway({
    policy: createPolicyHook(),
    audit: createAuditHook(),
    adapter: createLegacyAdapter((cmd) => {
      void cmd;
      return { status: "SKIPPED", correlationId: cmd.correlationId };
    }, "writeSurfaceShadowNoop"),
    safeMode: { enabled: true },
  });
  return __wsGateway;
}

const __isWsShadowEnabled = (): boolean => {
  try {
    const rt: any = globalThis as any;
    const decisions = rt?.__FEATURE_DECISIONS__ || rt?.__featureFlags?.decisions;
    if (Array.isArray(decisions)) return isEnabled(decisions, "brandservice_shadow");
    const flags = rt?.__FEATURE_FLAGS__ || rt?.__featureFlags?.flags;
    const state = flags?.["brandservice_shadow"]?.state;
    return state === "ON" || state === "ROLLOUT";
  } catch {
    return false;
  }
};

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

function readLocalOverride(): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readEnv(): Record<string, string> {
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

function mergeClean(a: Record<string, unknown>, b: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...(a || {}) };
  for (const k of Object.keys(b || {})) {
    const v = b[k];
    if (typeof v === "string" && v.trim() === "") continue;
    if (v === undefined || v === null) continue;
    out[k] = v;
  }
  return out;
}

function validateBrand(input: Record<string, unknown>): { ok: true; value: Brand; warnings: string[] } | { ok: false; warnings: string[] } {
  const w: string[] = [];
  const s = (x: unknown) => (typeof x === "string" ? x.trim() : "");

  const APP_DISPLAY_NAME = s(input.APP_DISPLAY_NAME);
  const TENANT_ID = s(input.TENANT_ID);
  const THEME_MODE = s(input.THEME_MODE) as Brand["THEME_MODE"];
  const ACCENT_COLOR = s(input.ACCENT_COLOR);

  if (!APP_DISPLAY_NAME) w.push("ERR_BRAND_INVALID: APP_DISPLAY_NAME missing/empty");
  if (!TENANT_ID || !/^[a-z0-9][a-z0-9\\-]+$/.test(TENANT_ID)) w.push("ERR_BRAND_INVALID: TENANT_ID invalid");
  if (!["dark", "light", "auto"].includes(THEME_MODE)) w.push("ERR_BRAND_INVALID: THEME_MODE invalid");
  if (!/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(ACCENT_COLOR)) w.push("ERR_BRAND_INVALID: ACCENT_COLOR invalid");

  const out: Brand = {
    APP_DISPLAY_NAME: APP_DISPLAY_NAME || "iCONTROL",
    APP_SHORT_NAME: s(input.APP_SHORT_NAME) || "iCONTROL",
    LEGAL_NAME: s(input.LEGAL_NAME) || APP_DISPLAY_NAME || "iCONTROL",
    TENANT_ID: TENANT_ID || "icontrol-default",
    TITLE_SUFFIX: s(input.TITLE_SUFFIX) || "",
    THEME_MODE: (["dark", "light", "auto"].includes(THEME_MODE) ? THEME_MODE : "dark"),
    ACCENT_COLOR: ACCENT_COLOR || "#6D28D9",
    LOGO_PRIMARY: s(input.LOGO_PRIMARY) || "",
    LOGO_COMPACT: s(input.LOGO_COMPACT) || ""
  };

  if (w.length) return { ok: false, warnings: w };
  return { ok: true, value: out, warnings: [] };
}

export function getBrandResolved(): BrandResolved {
  const warnings: string[] = [];

  const local = readLocalOverride();
  if (local) {
    const res = validateBrand(local);
    if (res.ok) return { brand: res.value, source: "override", warnings };
    warnings.push(...res.warnings);
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

export function setBrandLocalOverride(patch: Partial<Brand>): BrandOverrideResult {
  const current = readLocalOverride() || {};
  const next = mergeClean(current as Record<string, unknown>, patch as Record<string, unknown>);
  const v = validateBrand(mergeClean(FALLBACK, next));
  if (!v.ok) return { ok: false, warnings: v.warnings };
  const serialized = JSON.stringify(next);

  // SSR guard explicite (comportement: OK)
  if (typeof window === "undefined" || !window.localStorage) {
    return { ok: true };
  }

  // Legacy-first write (comportement: OK même si erreur)
  try {
    window.localStorage.setItem(LS_KEY, serialized);
  } catch {
    return { ok: true };
  }

  // Shadow (NO-OP) — uniquement si flag ON/ROLLOUT
  if (!__isWsShadowEnabled()) {
    return { ok: true };
  }

  const tenantId = (typeof getTenantId === "function" ? getTenantId() : "public") || "public";
  const correlationId = createCorrelationId("brand");
  const cmd = {
    kind: "BRANDSERVICE_WRITE_SHADOW",
    tenantId,
    correlationId,
    payload: { key: LS_KEY, bytes: serialized.length },
    meta: { shadow: true, source: "brandService.ts" },
  };

  try {
    const res = __resolveWsGateway().execute(cmd as any);
    if (res.status !== "OK" && res.status !== "SKIPPED") {
      __wsLogger.warn("WRITE_GATEWAY_WRITE_SURFACE_FALLBACK", {
        kind: cmd.kind,
        tenant_id: tenantId,
        correlation_id: correlationId,
        status: res.status,
      });
    }
  } catch (err) {
    __wsLogger.warn("WRITE_GATEWAY_WRITE_SURFACE_ERROR", {
      kind: cmd.kind,
      tenant_id: tenantId,
      correlation_id: correlationId,
      error: String(err),
    });
  }

  return { ok: true };
}

export function clearBrandLocalOverride(): void {
  try { localStorage.removeItem(LS_KEY); } catch {}
}
