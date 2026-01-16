// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { registerRuntimeConfigEndpoint } from "../core/runtime/runtimeConfigEndpoint";

describe("runtime-config shim — ON only when explicitly enabled", () => {
  const realFetch = globalThis.fetch;

  beforeEach(() => {
    // Provide a deterministic "network" fallback
    globalThis.fetch = vi.fn(
      async () => new Response("net", { status: 404 }),
    ) as any;
  });

  afterEach(() => {
    globalThis.fetch = realFetch as any;
    vi.restoreAllMocks();
  });

  it("intercepts strict GET /cp/api/runtime-config when registered", async () => {
    // register directly (equivalent to main.ts guard path when VITE_RUNTIME_CONFIG_SHIM=1)
    registerRuntimeConfigEndpoint();

    const res = await fetch("http://localhost/cp/api/runtime-config", {
      method: "GET",
    } as any);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toHaveProperty("tenant_id");
    expect(json).toHaveProperty("app_base_path");
    expect(json).toHaveProperty("cp_base_path");
    expect(json).toHaveProperty("api_base_url");
    expect(json).toHaveProperty("version");
  });

  it("does not intercept non-GET", async () => {
    registerRuntimeConfigEndpoint();
    const res = await fetch("http://localhost/cp/api/runtime-config", {
      method: "POST",
    } as any);
    expect(res.status).toBe(404);
  });
});
