import { describe, it, expect } from "vitest";
import { registerExtension, getExtension, listExtensions } from "../extensions/registry/registry";

describe("Extensions registry (contract)", () => {
  it("register/get/list", () => {
    registerExtension({ id: "x.test", name: "X", version: "0.0.1", capabilities: ["cap.a"] });
    expect(getExtension("x.test")?.name).toBe("X");
    expect(listExtensions().some(x => x.id === "x.test")).toBe(true);
  });
});
