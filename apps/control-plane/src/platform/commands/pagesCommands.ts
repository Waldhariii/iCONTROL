/**
 * Pages commands — sync, publish, revert, activate, deactivate.
 * Single place for CP pages mutations; Page.tsx = structure only.
 */

import { getApiBase } from "@/core/runtime/apiBase";
import { getSession } from "@/localAuth";
import { getPermissionClaims } from "@/runtime/rbac";

function getAuthHeaders(): Record<string, string> {
  const s = getSession();
  const role = String((s as any)?.role || "USER").toUpperCase();
  const userId = String((s as any)?.username || (s as any)?.userId || "");
  const tenantId = String((globalThis as any).__ICONTROL_RUNTIME__?.tenantId || "default");
  const perms = getPermissionClaims();
  return {
    "Content-Type": "application/json",
    "x-user-role": role,
    "x-user-id": userId,
    "x-tenant-id": tenantId,
    "x-user-permissions": perms.join(","),
  };
}

export type PagesCommandResult = { ok: boolean; error?: string };

export async function syncCatalog(): Promise<PagesCommandResult> {
  const res = await fetch(`${getApiBase()}/api/cp/pages/sync-catalog`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  const json = (await res.json()) as { success: boolean; error?: string };
  if (!res.ok || !json.success) return { ok: false, error: json.error || "Erreur sync." };
  return { ok: true };
}

export async function publishPage(id: string, expectedVersion: number): Promise<PagesCommandResult> {
  const res = await fetch(`${getApiBase()}/api/cp/pages/${encodeURIComponent(id)}/publish`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ expected_version: expectedVersion }),
  });
  const json = (await res.json()) as { success: boolean; error?: string };
  if (!res.ok || !json.success) {
    return { ok: false, error: json.error === "ERR_VERSION_CONFLICT" ? "Conflit de version: actualiser avant publier." : json.error || "Erreur publish." };
  }
  return { ok: true };
}

export async function revertPage(id: string): Promise<PagesCommandResult> {
  const res = await fetch(`${getApiBase()}/api/cp/pages/${encodeURIComponent(id)}/revert`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  const json = (await res.json()) as { success: boolean; error?: string };
  if (!res.ok || !json.success) return { ok: false, error: json.error || "Erreur revert." };
  return { ok: true };
}

export async function activatePage(id: string, expectedVersion: number): Promise<PagesCommandResult> {
  const res = await fetch(`${getApiBase()}/api/cp/pages/${encodeURIComponent(id)}/activate`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ expected_version: expectedVersion }),
  });
  const json = (await res.json()) as { success: boolean; error?: string };
  if (!res.ok || !json.success) return { ok: false, error: json.error || "Erreur activation." };
  return { ok: true };
}

export async function deactivatePage(id: string, expectedVersion: number): Promise<PagesCommandResult> {
  const res = await fetch(`${getApiBase()}/api/cp/pages/${encodeURIComponent(id)}/deactivate`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ expected_version: expectedVersion }),
  });
  const json = (await res.json()) as { success: boolean; error?: string };
  if (!res.ok || !json.success) return { ok: false, error: json.error || "Erreur désactivation." };
  return { ok: true };
}
