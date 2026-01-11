export type SafeMode = "STRICT" | "COMPAT";

/**
 * SAFE_MODE contract:
 * - STRICT: allow only builtin.* components (deterministic safe HTML); registry usage forbidden.
 * - COMPAT: allow registry resolution (still string-based + SafeRender gated).
 *
 * Default: COMPAT (non-breaking).
 */
export function getSafeMode(): SafeMode {
  try {
    const w = (globalThis as any)?.ICONTROL_SAFE_MODE;
    if (w === "STRICT" || w === "COMPAT") return w;
  } catch {}
  return "COMPAT";
}

export function isBuiltinId(id: string): boolean {
  return typeof id === "string" && id.startsWith("builtin.");
}
