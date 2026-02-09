import { ICONTROL_KEYS } from "../../core/runtime/storageKeys";
import { webStorage } from "../storage/webStorage";

export type ThemeModePreference = "dark" | "light" | "auto";

export function getStoredThemeModePreference(): ThemeModePreference | null {
  const raw = webStorage.get(ICONTROL_KEYS.settings.theme);
  if (raw === "dark" || raw === "light" || raw === "auto") return raw;
  return null;
}

export function resolveThemeMode(preference: ThemeModePreference | null): "dark" | "light" {
  if (preference === "light" || preference === "dark") return preference;
  if (preference === "auto") {
    try {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } catch {
      return "dark";
    }
  }
  return "dark";
}

export function applyThemeModePreference(preference: ThemeModePreference, root = document.documentElement): "dark" | "light" {
  webStorage.set(ICONTROL_KEYS.settings.theme, preference);
  const resolved = resolveThemeMode(preference);
  root.dataset["icThemeMode"] = resolved;
  root.dataset["icThemeModePref"] = preference;
  return resolved;
}

export function applyStoredThemeMode(root = document.documentElement): "dark" | "light" {
  const pref = getStoredThemeModePreference() ?? "dark";
  return applyThemeModePreference(pref, root);
}

export function installAutoThemeModeListener(root = document.documentElement): void {
  const pref = getStoredThemeModePreference();
  if (pref !== "auto") return;
  try {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      root.dataset["icThemeMode"] = mql.matches ? "dark" : "light";
    };
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handler);
    } else if (typeof (mql as any).addListener === "function") {
      (mql as any).addListener(handler);
    }
  } catch {
    // ignore
  }
}
