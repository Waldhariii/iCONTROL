export type RuntimeConfig = {
  tenant_id: string;
  app_base_path: string;
  cp_base_path: string;
  api_base_url: string;
  assets_base_url: string;
  version: number;
};

const LS_KEY = "icontrol.runtime.config.v1";
let cached: RuntimeConfig | null = null;

function resolveScope(): "/app" | "/cp" {
  try {
    const p = typeof window !== "undefined" ? window.location.pathname : "";
    if (p.startsWith("/cp")) return "/cp";
  } catch {}
  return "/app";
}

function fallbackConfig(): RuntimeConfig {
  return {
    tenant_id: "local",
    app_base_path: "/app",
    cp_base_path: "/cp",
    api_base_url: "/api",
    assets_base_url: "/assets",
    version: 1,
  };
}

function readCached(): RuntimeConfig | null {
  if (cached) return cached;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    cached = JSON.parse(raw) as RuntimeConfig;
    return cached;
  } catch {
    return null;
  }
}

function writeCached(next: RuntimeConfig) {
  cached = next;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  } catch {}
}

export async function resolveRuntimeConfig(): Promise<RuntimeConfig> {
  const existing = readCached();
  if (existing) return existing;

  const scope = resolveScope();
  try {
    const res = await fetch(`${scope}/api/runtime-config`, {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) throw new Error(`ERR_RUNTIME_CONFIG_${res.status}`);
    const json = (await res.json()) as RuntimeConfig;
    writeCached(json);
    return json;
  } catch {
    const fallback = fallbackConfig();
    writeCached(fallback);
    return fallback;
  }
}

export async function resolveApiBaseUrl(): Promise<string> {
  const cfg = await resolveRuntimeConfig();
  return cfg.api_base_url;
}
