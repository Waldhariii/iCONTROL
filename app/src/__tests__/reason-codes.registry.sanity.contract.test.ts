import { describe, it, expect } from "vitest";
import { REASON_CODES_V1 } from "../core/ports/reasonCodes.v1";

describe("Governance: Reason codes registry sanity (v1)", () => {
  it("is an array of string literals (quoted) + non-empty", () => {
    expect(Array.isArray(REASON_CODES_V1)).toBe(true);
    expect(REASON_CODES_V1.length).toBeGreaterThan(0);
    for (const c of REASON_CODES_V1 as unknown as string[]) {
      expect(typeof c).toBe("string");
      // avoid accidental TS identifiers / empty strings
      expect(c.trim().length).toBeGreaterThan(0);
      expect(c).toMatch(/^(OK|ERR|WARN)_[A-Z0-9_]+$/);
    }
  });

  it("is sorted + unique", () => {
    const arr = REASON_CODES_V1 as unknown as string[];
    const sorted = [...arr].slice().sort();
    expect(arr).toEqual(sorted);
    const set = new Set(arr);
    expect(set.size).toBe(arr.length);
  });
});
