import { getTenantId } from "../runtime/tenant";
import { loadEntitlements, saveEntitlements } from "./storage";
import type { Entitlements } from "./types";

export * from "./types";
export * from "./storage";
export * from "./gates";
export * from "./resolve";
export * from "./warnings";
export * from "./requireEntitlement";

// --- Access Guard adapter (non-core) ---
export function getEntitlements(): any {
  // fallback (if no explicit getter found)
  try {
    return (globalThis as any).__ICONTROL_ENTITLEMENTS__ ?? null;
  } catch {
    return null;
  }
}

export function readEntitlements(): Entitlements {
  return loadEntitlements(getTenantId());
}

export function writeEntitlements(e: Entitlements): void {
  saveEntitlements(getTenantId(), e);
}
