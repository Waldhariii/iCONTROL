import type { Entitlements, Plan } from "./types";

const PLAN_RANK: Record<Plan, number> = {
  FREE: 0,
  PRO: 1,
  ENTERPRISE: 2,
};

export function hasPlan(e: Entitlements, min: Plan): boolean {
  return PLAN_RANK[e.plan] >= PLAN_RANK[min];
}

export function hasModule(e: Entitlements, moduleKey: string): boolean {
  return Boolean(e.modules?.[moduleKey]);
}
