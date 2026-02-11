import { describe, it, expect } from "vitest";
import { resolveTheme } from "../platform/theme";

describe("theme manager (contract)", () => {
  it("returns default tokens (css vars) by default", () => {
    const t = resolveTheme({ tenantId: "t1", appKind: "APP", mode: "dark" });
    expect(t.tokens.bg).toContain("var(");
    expect(t.meta.source).toBe("default");
  });

  it("applies tenant override with CP precedence", () => {
    (globalThis as any).__ICONTROL_THEME_OVERRIDES__ = {
      t1: {
        CP: { accent: "var(--ic-accent-cp)" },
      },
    };

    const t = resolveTheme({ tenantId: "t1", appKind: "APP", mode: "dark" });
    expect(t.tokens.accent).toBe("var(--ic-accent-cp)");
    expect(t.meta.appliedOverrides).toBe(true);
  });
});
