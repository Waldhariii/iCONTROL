/**
 * Canonical CP prefs service — uses API /api/cp/prefs/:key (no direct localStorage in surfaces).
 */

import { getApiBase } from "@/core/runtime/apiBase";
import { resolveRuntimeContext } from "@/platform/runtimeContext/resolveRuntimeContext";
import { getSession } from "@/localAuth";

function getHeaders(): { "x-tenant-id": string; "x-user-id": string } {
  const ctx = resolveRuntimeContext({ fallbackAppKind: "CP" });
  const tenantId = ctx.tenantId ?? "default";
  const s = getSession() as { username?: string; userId?: string } | null;
  const userId = String(s?.username ?? s?.userId ?? "anonymous");
  return { "x-tenant-id": tenantId, "x-user-id": userId };
}

export async function getPref<T = unknown>(key: string): Promise<T | null> {
  const base = getApiBase();
  const res = await fetch(`${base}/api/cp/prefs/${encodeURIComponent(key)}`, {
    headers: getHeaders(),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { success?: boolean; data?: T | null };
  return json?.data ?? null;
}

export async function setPref(key: string, value: unknown): Promise<void> {
  const base = getApiBase();
  await fetch(`${base}/api/cp/prefs/${encodeURIComponent(key)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getHeaders() },
    body: JSON.stringify(value),
  });
}
