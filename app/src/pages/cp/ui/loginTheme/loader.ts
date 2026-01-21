import themeDefaults from "./login.theme.json";
import layoutDefaults from "./login.layout.json";

export type LoginTheme = typeof themeDefaults;
export type LoginLayout = typeof layoutDefaults;

type UnknownRecord = Record<string, unknown>;

type OverridePayload = {
  theme?: Partial<LoginTheme>;
  layout?: Partial<LoginLayout>;
};

type AuditEmitter = (event: { kind: string; scope: string; message: string }) => void;

function isObject(value: unknown): value is UnknownRecord {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function deepMerge<T>(base: T, override?: Partial<T>): T {
  if (!override || !isObject(base) || !isObject(override)) return base;
  const merged: UnknownRecord = { ...(base as UnknownRecord) };
  Object.entries(override).forEach(([key, value]) => {
    if (isObject(value) && isObject(merged[key])) {
      merged[key] = deepMerge(merged[key], value as UnknownRecord);
    } else if (value !== undefined) {
      merged[key] = value as unknown;
    }
  });
  return merged as T;
}

function getOverridePayload(): OverridePayload | null {
  if (typeof window === "undefined") return null;
  const override = (window as unknown as { __ICONTROL_CP_LOGIN_OVERRIDE__?: OverridePayload }).__ICONTROL_CP_LOGIN_OVERRIDE__;
  if (!override || !isObject(override)) return null;
  return override;
}

function emitAudit(message: string): void {
  if (typeof window === "undefined") return;
  const emitter = (window as unknown as { __ICONTROL_CP_AUDIT__?: AuditEmitter }).__ICONTROL_CP_AUDIT__;
  if (typeof emitter === "function") {
    emitter({ kind: "INFO", scope: "cp.login", message });
    return;
  }
  if (message) {
    console.warn("CP_LOGIN_AUDIT:", message);
  }
}

export function loadCpLoginTheme(): LoginTheme {
  const override = getOverridePayload();
  const theme = deepMerge(themeDefaults, override?.theme);
  if (!isValidTheme(theme)) {
    emitAudit("Invalid theme override detected for CP login. Falling back to defaults.");
    return themeDefaults;
  }
  if (override?.theme) emitAudit("Theme override applied for CP login.");
  return theme;
}

export function loadCpLoginLayout(): LoginLayout {
  const override = getOverridePayload();
  const layout = deepMerge(layoutDefaults, override?.layout);
  if (!isValidLayout(layout)) {
    emitAudit("Invalid layout override detected for CP login. Falling back to defaults.");
    return layoutDefaults;
  }
  if (override?.layout) emitAudit("Layout override applied for CP login.");
  return layout;
}

function isValidTheme(theme: LoginTheme): boolean {
  const required = [
    theme.background?.gradient,
    theme.background?.vignette,
    theme.background?.noise,
    theme.background?.noiseOpacity,
    theme.background?.noiseBlendMode,
    theme.card?.bg,
    theme.card?.border,
    theme.card?.shadow,
    theme.card?.blur,
    theme.card?.radius,
    theme.text?.fontFamily,
    theme.text?.primary,
    theme.input?.bg,
    theme.input?.border,
    theme.button?.gradient
  ];
  return required.every((value) => typeof value === "string" && value.length > 0);
}

function isValidLayout(layout: LoginLayout): boolean {
  if (!Array.isArray(layout.order) || layout.order.length === 0) return false;
  const required = [
    layout.page?.minHeight,
    layout.page?.padding,
    layout.card?.width,
    layout.card?.padding,
    layout.input?.height,
    layout.input?.radius,
    layout.button?.height
  ];
  return required.every((value) => typeof value === "string" && value.length > 0);
}
