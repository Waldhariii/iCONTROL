import { nsKey } from "../runtime/storageNs";
import { isSafeMode } from "../runtime/safeMode";
import { DEFAULT_ENTITLEMENTS, type Entitlements } from "./types";

const BASE_KEY = "entitlements.v1";

function safeParse(json: string): unknown {
  try { return JSON.parse(json); } catch { return null; }
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function coerceEntitlements(v: unknown): Entitlements {
  if (!isObject(v)) return DEFAULT_ENTITLEMENTS;

  const plan = (v.plan === "PRO" || v.plan === "ENTERPRISE" || v.plan === "FREE") ? v.plan : "FREE";
  const modules = isObject(v.modules) ? Object.fromEntries(
    Object.entries(v.modules).map(([k, val]) => [k, Boolean(val)])
  ) : {};
  const expiresAtMs = typeof v.expiresAtMs === "number" ? v.expiresAtMs : undefined;

  const e: Entitlements = { plan, modules, expiresAtMs };
  // expiry governance
  if (typeof e.expiresAtMs === "number" && Date.now() > e.expiresAtMs) {
    return DEFAULT_ENTITLEMENTS;
  }
  return e;
}

export function entitlementsKey(tenantId: string): string {
  // tenantId must be stable identifier; if unknown, use "local".
  const t = (tenantId || "local").trim();
  return nsKey(`${t}.${BASE_KEY}`);
}

export function loadEntitlements(tenantId: string): Entitlements {
  if (typeof window === "undefined" || !window.localStorage) return DEFAULT_ENTITLEMENTS;
  const raw = window.localStorage.getItem(entitlementsKey(tenantId));
  if (!raw) return DEFAULT_ENTITLEMENTS;
  return coerceEntitlements(safeParse(raw));
}

export function saveEntitlements(tenantId: string, e: Entitlements): void {
  if (isSafeMode()) return;
  if (typeof window === "undefined" || !window.localStorage) return;
  window.localStorage.setItem(entitlementsKey(tenantId), JSON.stringify(e));
}

export function clearEntitlements(tenantId: string): void {
  if (isSafeMode()) return;
  if (typeof window === "undefined" || !window.localStorage) return;
  window.localStorage.removeItem(entitlementsKey(tenantId));
}
