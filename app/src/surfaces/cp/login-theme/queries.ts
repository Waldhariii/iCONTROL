import React from "react";
import { useTenantContext } from "@/core/tenant/tenantContext";
import { readGlobalThemeOverrides } from "@/platform/theme/globalThemeOverrides";
import { getStoredThemeModePreference, type ThemeModePreference } from "@/platform/theme/themeMode";

export function useThemeAdminState() {
  const { tenantId } = useTenantContext();
  const [overrides, setOverrides] = React.useState(() => readGlobalThemeOverrides());
  const [modePreference, setModePreference] = React.useState<ThemeModePreference>(
    () => getStoredThemeModePreference() ?? "dark",
  );

  return {
    tenantId,
    overrides,
    setOverrides,
    modePreference,
    setModePreference,
  } as const;
}
