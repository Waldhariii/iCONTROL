/**
 * Runtime Config Endpoint (ICONTROL_RUNTIME_CONFIG_ENDPOINT_V1)
 * DEV-ONLY endpoint shim for GET /cp/api/runtime-config
 *
 * PERF: fast-path returns originalFetch unless strict match.
 * SECURITY: ignores query params; derives tenant from client SSOT for local dev only.
 * NOTE: In production, this must be replaced by a real server endpoint.
 */

import { getTenantId } from "./tenant";

type RuntimeConfig = {
  tenant_id: string;
  app_base_path: string;
  cp_base_path: string;
  api_base_url: string;
  assets_base_url?: string;
  version: number;
};

let registered = false;

function isLocalDev(): boolean {
  try {
    // Vite DEV flag (preferred)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyImportMeta = import.meta as any;
    if (anyImportMeta?.env?.DEV) return true;
  } catch {
    // ignore
  }
  try {
    const h = typeof window !== "undefined" ? window.location.hostname : "";
    return h === "localhost" || h === "127.0.0.1";
  } catch {
    return false;
  }
}

export function registerRuntimeConfigEndpoint(): void {
  if (registered || typeof window === "undefined") return;
  if (!isLocalDev()) return;

  registered = true;

  const w = window as unknown as Record<string, unknown>;
  if (!w.__ICONTROL_RUNTIME_CONFIG_SHIM__) {
    w.__ICONTROL_RUNTIME_CONFIG_SHIM__ = {
      v: 1,
      devOnly: true,
      installed_at: Date.now(),
    };
  }

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    // PERF: strict match only; otherwise no overhead besides URL parse in try-block.
    try {
      const req =
        typeof input === "string"
          ? new Request(input, init)
          : input instanceof URL
            ? new Request(input, init)
            : input;

      // quick method guard
      if ((req.method || "GET").toUpperCase() !== "GET")
        return originalFetch(input, init);

      const url = new URL(req.url, window.location.origin);

      // strict path match (ignore search params entirely)
      if (url.pathname === "/cp/api/runtime-config") {
        const tenantId = getTenantId();
        const origin = window.location.origin;

        const payload: RuntimeConfig = {
          tenant_id: tenantId,
          app_base_path: "/app",
          cp_base_path: "/cp",
          api_base_url: new URL("/api", origin).toString(),
          assets_base_url: new URL("/assets", origin).toString(),
          version: 1,
        };

        return new Response(JSON.stringify(payload), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    } catch {
      // fall through to network
    }

    return originalFetch(input, init);
  };
}
