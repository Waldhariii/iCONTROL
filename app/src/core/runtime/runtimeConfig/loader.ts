import type { RuntimeConfigV1 } from "../contracts/runtimeConfig";
import { makeDefaultRuntimeConfig } from "../contracts/runtimeConfig";

declare global {
  interface Window {
    __runtimeConfig?: RuntimeConfigV1;
  }
}

export async function loadRuntimeConfig(baseUrl: string = ""): Promise<RuntimeConfigV1> {
  const url = `${baseUrl}/api/runtime/config`;
  try {
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) return makeDefaultRuntimeConfig();
    return (await res.json()) as RuntimeConfigV1;
  } catch {
    return makeDefaultRuntimeConfig();
  }
}

export function applyRuntimeConfigToWindow(cfg: RuntimeConfigV1): void {
  window.__runtimeConfig = cfg;
}
