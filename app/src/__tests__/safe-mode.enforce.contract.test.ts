import { describe, it, expect, vi } from "vitest";
import { enforceSafeModeWrite } from "../policies/safe_mode.enforce.runtime";
import { ERROR_CODES } from "../core/errors/error_codes";

describe("SAFE_MODE enforcement (audit-first)", () => {
  it("OFF => allows writes, no enforcement", () => {
    const rt: any = {
      __SAFE_MODE__: {
        enabled: true,
        enforcement: {
          level: "OFF",
          scope: ["write"],
          blocked_actions: ["create"],
        },
      },
    };
    const d = enforceSafeModeWrite(rt, "create");
    expect(d.allowed).toBe(true);
    expect(d.enforced).toBe(false);
    expect(d.level).toBe("OFF");
  });

  it("SOFT => allows write and emits WARN once", () => {
    const emit = vi.fn();
    const rt: any = {
      audit: { emit },
      __SAFE_MODE__: {
        enabled: true,
        reason: "maintenance",
        enforcement: {
          level: "SOFT",
          scope: ["write"],
          blocked_actions: ["create", "update", "delete"],
          message: "Maintenance en cours",
        },
      },
    };

    const d1 = enforceSafeModeWrite(rt, "create", { route: "/x" });
    expect(d1.allowed).toBe(true);
    expect(d1.enforced).toBe(true);
    expect(d1.level).toBe("SOFT");

    const callsAfter = emit.mock.calls.length;
    const d2 = enforceSafeModeWrite(rt, "create");
    expect(d2.allowed).toBe(true);
    expect(emit.mock.calls.length).toBe(callsAfter);

    const first = emit.mock.calls[0]?.[0];
    expect(first).toBeDefined();
  });

  it("HARD => blocks write and emits ERR once", () => {
    const emit = vi.fn();
    const rt: any = {
      audit: { emit },
      __SAFE_MODE__: {
        enabled: true,
        reason: "maintenance",
        enforcement: {
          level: "HARD",
          scope: ["write"],
          blocked_actions: ["delete"],
          message: "Maintenance en cours",
        },
      },
    };

    const d1 = enforceSafeModeWrite(rt, "delete", { id: 123 });
    expect(d1.allowed).toBe(false);
    expect(d1.enforced).toBe(true);
    expect(d1.level).toBe("HARD");

    const callsAfter = emit.mock.calls.length;
    const d2 = enforceSafeModeWrite(rt, "delete");
    expect(d2.allowed).toBe(false);
    expect(emit.mock.calls.length).toBe(callsAfter);

    expect(
      (ERROR_CODES as any)?.ERR_SAFE_MODE_WRITE_BLOCKED ??
        "ERR_SAFE_MODE_WRITE_BLOCKED",
    ).toBeTruthy();
  });

  it("bypass capability => allows even in HARD", () => {
    const emit = vi.fn();
    const rt: any = {
      audit: { emit },
      __versionPolicy: { capabilities: ["SAFE_MODE_BYPASS"] },
      __SAFE_MODE__: {
        enabled: true,
        enforcement: {
          level: "HARD",
          scope: ["write"],
          blocked_actions: ["create"],
          allow_bypass_capabilities: ["SAFE_MODE_BYPASS"],
        },
      },
    };

    const d = enforceSafeModeWrite(rt, "create");
    expect(d.allowed).toBe(true);
    expect(d.enforced).toBe(false);
    expect(emit.mock.calls.length).toBe(0);
  });

  it("does not throw without audit emitter", () => {
    const rt: any = {
      __SAFE_MODE__: {
        enabled: true,
        enforcement: {
          level: "HARD",
          scope: ["write"],
          blocked_actions: ["update"],
        },
      },
    };

    expect(() => enforceSafeModeWrite(rt, "update")).not.toThrow();
    const d = enforceSafeModeWrite(rt, "update");
    expect(d.allowed).toBe(false);
  });
});
