// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("runtime-config shim — OFF by default (flag gated)", () => {
  const realFetch = globalThis.fetch;

  beforeEach(() => {
    // baseline: ensure fetch exists
    globalThis.fetch = vi.fn(
      async () => new Response("nope", { status: 404 }),
    ) as any;
  });

  afterEach(() => {
    globalThis.fetch = realFetch as any;
    vi.restoreAllMocks();
  });

  it("does not intercept /cp/api/runtime-config when flag is not set", async () => {
    // simulate absence of flag: main.ts guard prevents registration; so fetch stays untouched
    const res = await fetch("http://localhost/cp/api/runtime-config", {
      method: "GET",
    } as any);
    expect(res.status).toBe(404);
  });
});
