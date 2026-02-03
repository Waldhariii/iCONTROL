import { describe, it, expect } from "vitest";
import * as Ports from "../core/ports";

const EXPECTED = [
    "makeTenantOnboardingPersistedFacade",
  "TENANT_ONBOARDING_PERSIST_CONTRACT_ID",

] as const;

describe("ports public surface freeze (contract)", () => {
  it("exports list is stable + sorted", () => {
    const actual = Object.keys(Ports).sort((a, b) => a.localeCompare(b));
    expect(actual).toEqual([...EXPECTED]);
    expect([...EXPECTED]).toEqual([...new Set([...EXPECTED])].sort((a, b) => a.localeCompare(b)));
  });
});
