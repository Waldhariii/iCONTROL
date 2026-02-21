import { getApiBase } from "@/core/runtime/apiBase";
import {
  normalizeAuthContext,
  type RawRuntime,
} from "@/core/runtime/authContext";
import {
  getApiAccessToken,
  ensureApiAccessToken,
  clearApiAccessToken,
} from "@/services/authService";
import { wrapFetchWithTracer } from "@/platform/observability/tracer";
import { record401 } from "@/platform/observability/anomalyGuard";
import { getCorrelationId } from "@/platform/observability/correlation";
import { increment } from "@/platform/observability/metrics";

type Json = unknown;

function readJsonSafe(txt: string): Json | null {
  try {
    return JSON.parse(txt) as Json;
  } catch {
    return null;
  }
}

function isAuthFailure(status: number, body: unknown): boolean {
  if (status !== 401) return false;
  const code = (body as { code?: string })?.code;
  return code === "INVALID_TOKEN" || code === "AUTH_REQUIRED";
}

function getRawRuntime(): RawRuntime {
  if (typeof window === "undefined") return false;
  const w = window as unknown as { __ICONTROL_RUNTIME__?: RawRuntime };
  return w.__ICONTROL_RUNTIME__ ?? false;
}

function runtimeCtx(): { tenantId: string; userId: string; role: string } {
  const ctx = normalizeAuthContext(getRawRuntime());
  return {
    tenantId: ctx.tenantId,
    userId: ctx.actorId,
    role: ctx.role,
  };
}

/**
 * Merge headers: init first, then auth on top (auth always wins).
 * Default accept: application/json (init can override for CSV/download).
 */
function mergeHeaders(
  initHeaders?: HeadersInit,
  authHeaders?: Record<string, string>
): Record<string, string> {
  const out: Record<string, string> = {};

  if (initHeaders) {
    const entries =
      typeof initHeaders === "object" && !(initHeaders instanceof Headers)
        ? Array.isArray(initHeaders)
          ? (initHeaders as [string, string][])
          : Object.entries(initHeaders as Record<string, string>)
        : Array.from((initHeaders as Headers).entries());

    for (const [k, v] of entries) {
      if (v !== undefined && v !== null) out[k.toLowerCase()] = String(v);
    }
  }

  if (!out["accept"]) out["accept"] = "application/json";

  if (authHeaders) {
    for (const [k, v] of Object.entries(authHeaders)) {
      if (v !== undefined && v !== null) out[k.toLowerCase()] = String(v);
    }
  }

  return out;
}

function buildAuthHeaders(): Record<string, string> {
  const { tenantId, userId, role } = runtimeCtx();
  const token = getApiAccessToken();
  const headers: Record<string, string> = {
    "x-tenant-id": tenantId,
    "x-user-id": userId,
    "x-user-role": role,
    "x-correlation-id": getCorrelationId(),
  };
  if (token) headers["authorization"] = `Bearer ${token}`;
  return headers;
}

/**
 * Preflight token acquisition (best-effort):
 * - If token missing, try ensureApiAccessToken() BEFORE first API call.
 * - Avoids first-call 401 loops / boot-block under Safari.
 */
async function preEnsureTokenIfMissing(): Promise<void> {
  if (getApiAccessToken()) return;
  try {
    await ensureApiAccessToken();
  } catch {
    // best-effort: the real error will surface on request/401 handling
  }
}

/**
 * Core fetch (internal): auth headers always win over init.
 * On 401 INVALID_TOKEN/AUTH_REQUIRED: clear token, ensureApiAccessToken(), retry once (body read via clone only).
 */
async function cpFetchInternal(
  path: string,
  init?: RequestInit,
  retry = true
): Promise<Response> {
  // IMPORTANT: ensure token early (no-op if already present)
  await preEnsureTokenIfMissing();

  increment("api.request.total");

  const base = getApiBase();
  const url = path.startsWith("http")
    ? path
    : `${base}${path.startsWith("/") ? "" : "/"}${path}`;

  const authHeaders = buildAuthHeaders();
  const headers = mergeHeaders(init?.headers, authHeaders);

  const res = await fetch(url, {
    ...init,
    headers,
    credentials: "include",
  });

  if (!retry) return res;

  if (res.status === 401) {
    increment("api.response.401");
    record401();
    let body: unknown = null;
    try {
      const cloned = res.clone();
      const txt = await cloned.text();
      body = readJsonSafe(txt);
    } catch {
      // ignore clone/read errors
    }

    if (isAuthFailure(res.status, body)) {
      clearApiAccessToken();

      // Acquire a fresh token (propagate failure)
      await ensureApiAccessToken();

      // Retry exactly once
      return cpFetchInternal(path, init, false);
    }
  }

  return res;
}

/** Core fetch wrapped with tracer (O1 observability). */
export const cpFetch = wrapFetchWithTracer(cpFetchInternal, "cpFetch");

/**
 * JSON wrapper: one body read, throw { status, body } on !res.ok.
 */
export async function cpFetchJson<T = Json>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await cpFetch(path, init);
  const txt = await res.text();
  const body = readJsonSafe(txt);

  if (!res.ok) {
    const err = new Error("API_ERROR") as Error & { status: number; body: unknown };
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return (body ?? null) as T;
}
