import { writeGlobalThemeOverrides } from "@/platform/theme/globalThemeOverrides";
import { applyGlobalThemeOverrides, readGlobalThemeOverrides } from "@/platform/theme/globalThemeOverrides";
import { applyThemeModePreference, type ThemeModePreference } from "@/platform/theme/themeMode";
import type { AppKind } from "@/platform/theme/types";

export function useThemeAdminCommands() {
  const saveOverrides = async (appKind: AppKind, next: Record<string, string>) => {
    const current = readGlobalThemeOverrides();
    const merged = {
      ...(current.theme ?? {}),
      [appKind]: { ...(current.theme?.[appKind] ?? {}), ...next },
    } as any;
    await writeGlobalThemeOverrides({ theme: merged });
    applyGlobalThemeOverrides(appKind, { ...current, theme: merged });
  };

  const resetOverrides = async (appKind: AppKind) => {
    const current = readGlobalThemeOverrides();
    const merged = { ...(current.theme ?? {}) } as any;
    delete merged[appKind];
    await writeGlobalThemeOverrides({ theme: merged });
    applyGlobalThemeOverrides(appKind, { ...current, theme: merged });
  };

  const setModePreference = (preference: ThemeModePreference) => {
    applyThemeModePreference(preference);
  };

  return { saveOverrides, resetOverrides, setModePreference } as const;
}
