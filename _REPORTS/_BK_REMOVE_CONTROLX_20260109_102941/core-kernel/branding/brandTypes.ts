export type ThemeMode = "dark" | "light" | "auto";

export type Brand = {
  APP_DISPLAY_NAME: string;
  APP_SHORT_NAME?: string;
  LEGAL_NAME?: string;
  TENANT_ID: string;
  TITLE_SUFFIX?: string;
  THEME_MODE: ThemeMode;
  ACCENT_COLOR: string;
  LOGO_PRIMARY?: string;
  LOGO_COMPACT?: string;
};

export type BrandSource = "override" | "env" | "default" | "fallback";

export type BrandResolved = {
  brand: Brand;
  source: BrandSource;
  warnings: string[];
};
