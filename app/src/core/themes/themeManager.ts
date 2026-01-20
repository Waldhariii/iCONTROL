/**
 * ICONTROL_THEME_MANAGER_STUB_V1
 * Stub minimal pour unblock bundling/tests.
 * À remplacer par un vrai ThemeManager (tokens, persistence, dark/light, hooks).
 */

export type ThemeMode = "light" | "dark" | "system";

export type ThemeState = {
  mode: ThemeMode;
  resolved: "light" | "dark";
};

export function getThemeState(): ThemeState {
  return { mode: "system", resolved: "light" };
}

export function setThemeMode(_mode: ThemeMode): void {
  // Stub: no-op
}

export function applyThemeToDocument(): void {
  // Stub: no-op
}

// AUTO-STUB export for build unblock
export function themeManager(..._args: any[]): any { return undefined; }
