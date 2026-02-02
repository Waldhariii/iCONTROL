import type { RuntimeIdentityPort, RuntimeIdentity } from "../ports/runtimeIdentity.contract";

/**
 * NOTE:
 * We intentionally avoid importing core-kernel directly.
 * This implementation must stay within APP boundary and use only local runtime/session utilities.
 *
 * Strategy:
 * - Prefer reading from an explicit runtime/session object if available.
 * - Allow dev fallback ONLY when VITE_DEVONLY is true (or similar marker) OR SAFE_MODE is enabled.
 */
function isDevOnly(): boolean {
  // Keep runtime-safe for node tests: do not assume import.meta is present.
  try {
    // @ts-ignore
    return Boolean((globalThis as any).__ICONTROL_DEVONLY__ === true);
  } catch {
    return false;
  }
}

function isSafeModeEnabled(): boolean {
  try {
    // Prefer an existing SAFE_MODE probe if present
    // @ts-ignore
    return Boolean((globalThis as any).__ICONTROL_SAFE_MODE__ === true);
  } catch {
    return false;
  }
}

/**
 * Attempt to read from an existing session/runtime identity store.
 * This is intentionally conservative: if unknown, return null.
 */
function readFromKnownRuntime(): RuntimeIdentity | null {
  const g: any = globalThis as any;

  // Pattern A: runtime object
  if (g.__ICONTROL_RUNTIME__ && typeof g.__ICONTROL_RUNTIME__ === "object") {
    const rt = g.__ICONTROL_RUNTIME__;
    if (typeof rt.tenantId === "string" && typeof rt.actorId === "string") {
      return { tenantId: rt.tenantId, actorId: rt.actorId, source: "session" };
    }
  }

  // Pattern B: session object
  if (g.__ICONTROL_SESSION__ && typeof g.__ICONTROL_SESSION__ === "object") {
    const s = g.__ICONTROL_SESSION__;
    if (typeof s.tenantId === "string" && typeof s.actorId === "string") {
      return { tenantId: s.tenantId, actorId: s.actorId, source: "session" };
    }
  }

  return null;
}

function mkDevDefault(): RuntimeIdentity {
  return { tenantId: "default", actorId: "dev", source: "dev-default" };
}

function mkSafeModeDefault(): RuntimeIdentity {
  return { tenantId: "default", actorId: "safe-mode", source: "safe-mode-default" };
}

export function createRuntimeIdentityPort(): RuntimeIdentityPort {
  return {
    tryGet(): RuntimeIdentity | null {
      const found = readFromKnownRuntime();
      if (found) return found;

      if (isSafeModeEnabled()) return mkSafeModeDefault();
      if (isDevOnly()) return mkDevDefault();

      return null;
    },

    get(): RuntimeIdentity {
      const v = this.tryGet();
      if (!v) {
        // strict path: no implicit fallback in prod
        throw new Error("ERR_RUNTIME_IDENTITY_UNAVAILABLE");
      }
      return v;
    },
  };
}
