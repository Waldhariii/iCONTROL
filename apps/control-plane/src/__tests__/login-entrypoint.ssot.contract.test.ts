import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const readMl = () =>
  readFileSync(resolve(process.cwd(), "src/moduleLoader.ts"), "utf8");

describe("SSOT: entrypoint contract (post-login purge)", () => {
  it("moduleLoader relies on app-scoped registries and does not reintroduce legacy login entrypoint", () => {
    const ml = readMl();

    // Architecture contract: APP/CP separated via registries (no shared visual pages).
    expect(ml).toContain('./surfaces/app/manifest');
    expect(ml).toContain('./surfaces/cp/manifest');

    // Ensure the legacy login entrypoint is not reintroduced.
    expect(ml).not.toMatch(/["']login["']/);

    // Ensure suffix strategy remains (_app/_cp) for global uniqueness.
    expect(ml).toMatch(/_app/);
    expect(ml).toMatch(/_cp/);
  });
});
