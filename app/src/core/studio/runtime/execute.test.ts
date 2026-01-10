import { describe, expect, it, vi } from "vitest";

import { safeRender } from "../engine";
import { executePlan } from "./execute";
import type { RenderPlan } from "./types";

describe("executePlan", () => {
  it("escapes text ops into <pre>", () => {
    const plan: RenderPlan = { ops: [{ op: "text", value: `<img onerror="x">` }] };
    const res = executePlan(plan);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value).toContain("&lt;img onerror=&quot;x&quot;&gt;");
  });

  it("renders builtin.table with props", () => {
    const plan: RenderPlan = {
      ops: [{
        op: "component",
        id: "builtin.table",
        props: { title: "T", columns: ["A"], rows: [{ A: "1" }] }
      }]
    };
    const res = executePlan(plan);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value).toContain('data-builtin="table"');
      expect(res.value).toContain("T");
      expect(res.value).toContain("<table");
    }
  });

  it("supports caption + emptyText when rows are empty", () => {
    const plan: RenderPlan = {
      ops: [{
        op: "component",
        id: "builtin.table",
        props: { title: "X", caption: "Cap", emptyText: "No rows", rows: [] }
      }]
    };
    const res = executePlan(plan);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value).toContain("Cap");
      expect(res.value).toContain("No rows");
    }
  });

  it("passes props to registry.resolve renderers", () => {
    let received: Record<string, unknown> | null = null;
    const resolve = vi.fn().mockReturnValue((props: Record<string, unknown>) => {
      received = props;
      return "ok";
    });

    const plan: RenderPlan = {
      ops: [{ op: "component", id: "x.custom", props: { a: 1 } }]
    };
    const res = executePlan(plan, { registry: { resolve } });
    expect(res.ok).toBe(true);
    expect(resolve).toHaveBeenCalledWith("x.custom");
    expect(received).toEqual({ a: 1 });
  });
});

describe("safeRender", () => {
  it("blocks inline handlers from renderer output", () => {
    const res = safeRender(`<div onclick="x">x</div>`);
    expect(res.ok).toBe(false);
  });
});
