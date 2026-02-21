/**
 * O3 Export config — disabled by default; explicit env flags only.
 * Never throw. If enabled but endpoint missing → disabled + warn.
 */
import { warn } from "./logger";

export type ExportConfig = {
  enabled: boolean;
  endpoint?: string;
  apiKey?: string;
  transport: "noop" | "fetch";
};

function getEnv(key: string): string | undefined {
  try {
    if (typeof import.meta !== "undefined" && (import.meta as { env?: Record<string, string> }).env?.[key] !== undefined) {
      return String((import.meta as { env: Record<string, string> }).env[key] ?? "").trim() || undefined;
    }
  } catch {}
  return undefined;
}

export function getExportConfig(): ExportConfig {
  try {
    const enabled = getEnv("VITE_OBS_EXPORT_ENABLED") === "true";
    const endpoint = getEnv("VITE_OBS_EXPORT_ENDPOINT");
    const apiKey = getEnv("VITE_OBS_EXPORT_API_KEY");

    if (enabled && (!endpoint || !endpoint.startsWith("http"))) {
      warn("WARN_OBS_EXPORT_DISABLED", "OBS export enabled but endpoint missing or invalid; treating as disabled", {
        payload: { endpoint: endpoint ?? "(empty)" },
      });
      return { enabled: false, transport: "noop" };
    }
    if (!enabled) return { enabled: false, transport: "noop" };
    const out: ExportConfig = { enabled: true, transport: endpoint ? "fetch" : "noop" };
    if (endpoint) out.endpoint = endpoint;
    if (apiKey) out.apiKey = apiKey;
    return out;
  } catch {
    return { enabled: false, transport: "noop" };
  }
}
