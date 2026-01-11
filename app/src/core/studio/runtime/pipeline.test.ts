import { describe, expect, it } from "vitest";

import { compilePlan } from "./plan";
import { executePlan } from "./execute";
import { safeRender } from "../engine";

describe("pipeline E2E (compile -> execute -> safeRender)", () => {
  it("renders builtins and passes SafeRender", () => {
    const doc: any = {
      data: {
        blocks: [
          { type: "table", title: "Demo", columns: ["name"], rows: [{ name: "Alice" }, { name: "Bob" }] },
          { type: "form", title: "Contact", fields: [{ name: "email", label: "Email", type: "email" }] },
          { type: "text", text: "hello world" },
        ],
      },
    };

    const cp = compilePlan(doc);
    expect(cp.ok).toBe(true);
    if (!cp.ok) return;

    const ex = executePlan(cp.value, {});
    expect(ex.ok).toBe(true);
    if (!ex.ok) return;

    const sr = safeRender(ex.value);
    expect(sr.ok).toBe(true);
    if (sr.ok) {
      expect(sr.html).toContain('data-builtin="table"');
      expect(sr.html).toContain('data-builtin="form"');
    }
  });
});
