/**
 * SAFE_MODE (v1)
 * - When enabled, write operations to storage should be blocked
 * - Signal sources:
 *   1) window.__ICONTROL_SAFE_MODE__ (runtime override)
 *   2) localStorage flag "icontrol.runtime.safeMode.v1"
 */
const SAFE_KEY = "icontrol.runtime.safeMode.v1";

export function isSafeMode(): boolean {
  try {
    const w: any = window as any;
    if (typeof w.__ICONTROL_SAFE_MODE__ === "boolean") return w.__ICONTROL_SAFE_MODE__;
    const v = localStorage.getItem(SAFE_KEY);
    return v === "1" || v === "true";
  } catch {
    return false;
  }
}

/** Dev-only helper */
export function setSafeMode(on: boolean) {
  try {
    const w: any = window as any;
    w.__ICONTROL_SAFE_MODE__ = on;
  } catch {
    // no-op
  }
  localStorage.setItem(SAFE_KEY, on ? "1" : "0");
}
