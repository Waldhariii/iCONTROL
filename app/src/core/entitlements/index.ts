export * from "./types";
export * from "./storage";
export * from "./gates";
export * from "./resolve";
export * from "./warnings";
export * from "./requireEntitlement";


// --- Access Guard adapter (non-core) ---
export function getEntitlements(): any {
  // fallback (if no explicit getter found)
  try { return (globalThis as any).__ICONTROL_ENTITLEMENTS__ ?? null; } catch { return null; }
}
