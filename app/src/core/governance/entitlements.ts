export type Entitlement =
  | "core"
  | "pro"
  | "enterprise";

export function hasEntitlement(level: Entitlement): boolean {
  // Dormant logic — default free/core
  if (level === "core") return true;
  return false;
}
