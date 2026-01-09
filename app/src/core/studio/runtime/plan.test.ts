import { describe, expect, it } from "vitest";

import { compilePlan } from "./plan";
import type { RenderPlan } from "./types";

describe("compilePlan", () => {
  it("maps text blocks to text ops", () => {
    const blueprint = { data: { pages: [{ blocks: [{ type: "text", text: "Hello" }] }] } };
    const res = compilePlan(blueprint as any);
    expect(res.ok).toBe(true);
    if (res.ok) {
      const plan = res.value as RenderPlan;
      expect(plan.ops[0]).toEqual({ op: "text", value: "Hello" });
    }
  });

  it("maps table/form blocks to builtin component ops with props", () => {
    const blueprint = {
      data: {
        pages: [{
          blocks: [
            { type: "table", title: "T", columns: ["A"], rows: [{ A: "1" }] },
            { type: "form", title: "F", fields: [{ id: "x" }] }
          ]
        }]
      }
    };
    const res = compilePlan(blueprint as any);
    expect(res.ok).toBe(true);
    if (res.ok) {
      const [table, form] = res.value.ops as any[];
      expect(table).toEqual({
        op: "component",
        id: "builtin.table",
        props: { title: "T", columns: ["A"], rows: [{ A: "1" }] }
      });
      expect(form).toEqual({
        op: "component",
        id: "builtin.form",
        props: { title: "F", fields: [{ id: "x" }] }
      });
    }
  });

  it("does not stringify valid blocks when mixed with invalid ones", () => {
    const blueprint = {
      data: { pages: [{ blocks: [{ type: "text", text: "A" }, { foo: "bar" }] }] }
    };
    const res = compilePlan(blueprint as any);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.ops[0]).toEqual({ op: "text", value: "A" });
      expect(res.value.ops.length).toBe(2);
    }
  });
  it("does not stringify valid text blocks (anti-regression)", () => {
    const doc: any = { data: { blocks: [{ type: "text", text: "hello" }] } };
    const r = compilePlan(doc);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const text = r.value.ops.filter((op: any) => op.op === "text").map((op: any) => String(op.value)).join("\n");
    expect(text).toContain("hello");
    expect(text).not.toContain('{"type":"text"');
  });
});
