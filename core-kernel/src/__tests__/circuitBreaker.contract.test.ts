import { describe, it, expect } from "vitest";
import { withCircuit } from "../circuit/circuitBreaker";

describe("circuitBreaker (contract)", () => {
  it("exposes withCircuit shape", () => {
    expect(typeof withCircuit).toBe("function");
  });
});
