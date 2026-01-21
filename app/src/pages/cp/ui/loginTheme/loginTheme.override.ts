import { appendAuditEvent } from "/src/core/audit/auditLog";
import { isSafeMode } from "/src/core/runtime/safeMode";
import { getRole } from "/src/runtime/rbac";
import {
  CP_LOGIN_THEMES,
  DEFAULT_CP_LOGIN_PRESET,
  type CpLoginTheme,
  type CpLoginThemePresetName
} from "./loginTheme";

type MetallicEffect = {
  enabled: boolean;
  intensity: number;
};

type ThemeEffects = {
  metallic: MetallicEffect;
};

export type CpLoginThemeOverride = {
  tokens?: Partial<CpLoginTheme>;
  effects?: Partial<ThemeEffects>;
};

export type EffectiveLoginTheme = {
  theme: CpLoginTheme;
  effects: ThemeEffects;
  source: "runtime" | "local" | "default";
};

const LS_KEY = "icontrol.cp.loginTheme.override.v1";

const defaultEffects: ThemeEffects = {
  metallic: { enabled: false, intensity: 0.6 }
};

function isObject(value: unknown): value is Record<string, any> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function deepMerge<T>(base: T, override?: Partial<T>): T {
  if (!override || !isObject(base) || !isObject(override)) return base;
  const merged: Record<string, any> = { ...(base as Record<string, any>) };
  Object.entries(override).forEach(([key, value]) => {
    if (isObject(value) && isObject(merged[key])) {
      merged[key] = deepMerge(merged[key], value as Record<string, any>);
    } else if (value !== undefined) {
      merged[key] = value as unknown;
    }
  });
  return merged as T;
}

function readRuntimeOverride(): CpLoginThemeOverride | null {
  if (typeof window === "undefined") return null;
  const runtime = (window as any).__ICONTROL_RUNTIME_CONFIG__;
  const override = runtime?.cpLoginThemeOverride || runtime?.loginThemeOverride;
  if (!override) return null;
  return isObject(override) ? (override as CpLoginThemeOverride) : null;
}

function readLocalOverride(): CpLoginThemeOverride | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isObject(parsed) ? (parsed as CpLoginThemeOverride) : null;
  } catch {
    return null;
  }
}

export function getLoginThemeOverride(): { override: CpLoginThemeOverride | null; source: "runtime" | "local" | "default" } {
  const runtime = readRuntimeOverride();
  if (runtime) return { override: runtime, source: "runtime" };
  const local = readLocalOverride();
  if (local) return { override: local, source: "local" };
  return { override: null, source: "default" };
}

export function getEffectiveLoginTheme(preset: CpLoginThemePresetName): EffectiveLoginTheme {
  const base = CP_LOGIN_THEMES[preset] ?? CP_LOGIN_THEMES[DEFAULT_CP_LOGIN_PRESET];
  const { override, source } = getLoginThemeOverride();
  const mergedTokens = override?.tokens ? deepMerge(base, override.tokens) : base;
  const effects = override?.effects ? deepMerge(defaultEffects, override.effects) : defaultEffects;
  return { theme: mergedTokens, effects, source: override ? source : "default" };
}

function canWrite(): boolean {
  const role = getRole();
  const allowed = role === "SYSADMIN" || role === "ADMIN";
  return allowed && !isSafeMode();
}

export function saveLoginThemeOverride(next: CpLoginThemeOverride): { ok: boolean; reason?: string } {
  if (!canWrite()) return { ok: false, reason: "READ_ONLY" };
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(next));
    appendAuditEvent({
      level: "INFO",
      code: "CP_LOGIN_THEME_OVERRIDE_SAVED",
      scope: "cp.loginTheme",
      message: "CP login theme override saved",
      meta: { keys: Object.keys(next.tokens || {}) }
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: String(error) };
  }
}

export function clearLoginThemeOverride(): { ok: boolean; reason?: string } {
  if (!canWrite()) return { ok: false, reason: "READ_ONLY" };
  try {
    localStorage.removeItem(LS_KEY);
    appendAuditEvent({
      level: "INFO",
      code: "CP_LOGIN_THEME_OVERRIDE_RESET",
      scope: "cp.loginTheme",
      message: "CP login theme override cleared"
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: String(error) };
  }
}

export function exportLoginThemeOverride(): string {
  const { override } = getLoginThemeOverride();
  return JSON.stringify(override || {}, null, 2);
}

export function importLoginThemeOverride(raw: string): { ok: boolean; reason?: string } {
  if (!canWrite()) return { ok: false, reason: "READ_ONLY" };
  try {
    const parsed = JSON.parse(raw);
    if (!isObject(parsed)) return { ok: false, reason: "INVALID_JSON" };
    localStorage.setItem(LS_KEY, JSON.stringify(parsed));
    appendAuditEvent({
      level: "INFO",
      code: "CP_LOGIN_THEME_OVERRIDE_IMPORTED",
      scope: "cp.loginTheme",
      message: "CP login theme override imported"
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: String(error) };
  }
}

export function isLoginThemeReadOnly(): boolean {
  return !canWrite();
}
