export type ThemeLayer = "base" | "brand" | "tenant" | "runtime";

export interface DesignToken {
  token_key: string;
  token_group: string;
  type: string;
  value: unknown;
  units: string;
  constraints: Record<string, unknown>;
  token_version: string;
}

export interface Theme {
  theme_id: string;
  layer: ThemeLayer;
  inherits_from: string;
}
