/**
 * ICONTROL_DEV_ONLY_GATE_V1
 * SSOT DEV gating helper — must be deterministic and safe under Vitest/Node.
 */
export function isDevOnlyAllowed(): boolean {
  try {
    // Vite dev flag (preferred)
    const im: any = (globalThis as any).import?.meta;
    if (im?.env && typeof im.env.DEV === "boolean") return !!im.env.DEV;

    // Global DEV toggles (fallbacks)
    const rt: any = globalThis as any;
    if (typeof rt.__DEV__ === "boolean") return !!rt.__DEV__;
    if (typeof rt.__ICONTROL_DEV__ === "boolean") return !!rt.__ICONTROL_DEV__;

    // Browser heuristic (safe)
    if (typeof window !== "undefined" && window?.location) {
      const h = window.location.hostname || "";
      if (h === "localhost" || h === "127.0.0.1") return true;
    }
  } catch {
    // no-op
  }
  return false;
}
