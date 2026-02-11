// @ts-nocheck
export type SafeMode = "STRICT" | "COMPAT";

export function getSafeMode(): SafeMode {
  const v = (globalThis as any).ICONTROL_SAFE_MODE;
  return v === "STRICT" ? "STRICT" : "COMPAT";
}
