/* ICONTROL_DIAG_DEVONLY_ROUTES_V1 */
/**
 * SSOT: Diagnostic DEV-only install.
 * Contract targets:
 * - globalThis.__ICONTROL_DIAGNOSTIC__ is a FUNCTION (callable) exposing properties:
 *   version, mount, sanity, nowISO
 * - defineProperty: enumerable:false, writable:false, configurable:true (so tests can delete)
 * - Calling global fn returns an API object including export()
 */

export type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | { [k: string]: Json };

type MountSnap = {
  hasCxMain: boolean;
  cxMainConnected: boolean;
  hasAppEl: boolean;
  globalMountSet: boolean;
  globalMountConnected: boolean;
  resolvedTag: string;
};

type DevOnlySnap = {
  allowed: boolean;
  cpRoutes: string[];
  cpRoutesCount: number;
};

type DiagnosticExport = {
  ok: true;
  ts: number;
  devOnly: DevOnlySnap;
};

export type DiagnosticApi = {
  export: () => DiagnosticExport;
  devOnly: () => DevOnlySnap;
};

type G = typeof globalThis & {
  __ICONTROL_DIAGNOSTIC__?: any;
};

function safeResolvedTag(): string {
  // In vitest/node, process.env exists; in browser it may not.
  try {
    const p: any = (globalThis as any).process;
    const tag = p?.env?.VITE_APP_KIND || p?.env?.APP_KIND || p?.env?.NODE_ENV;
    return typeof tag === "string" && tag.length ? tag : "UNKNOWN";
  } catch {
    return "UNKNOWN";
  }
}

function computeMountSnap(): MountSnap {
  const w: any = globalThis as any;

  const hasCxMain = !!w.__CX_MAIN__;
  const cxMainConnected = hasCxMain && typeof w.__CX_MAIN__ === "object";

  const hasAppEl =
    typeof (globalThis as any).document !== "undefined" &&
    !!(globalThis as any).document.getElementById?.("app");

  // Reserved for future: if you ever store a mount handle on global, reflect it here.
  const globalMountSet = typeof w.__ICONTROL_DIAGNOSTIC_MOUNT__ !== "undefined";
  const globalMountConnected = !!w.__ICONTROL_DIAGNOSTIC_MOUNT__;

  const resolvedTag = safeResolvedTag();

  return {
    hasCxMain,
    cxMainConnected,
    hasAppEl,
    globalMountSet,
    globalMountConnected,
    resolvedTag,
  };
}

function createApi(): DiagnosticApi {
  // DEV-only routes diagnostic (keep zero hard deps; pull from global if you already expose it elsewhere)
  const w: any = globalThis as any;
  const routes: string[] = Array.isArray(w.__ICONTROL_DEVONLY_CP_ROUTES__)
    ? [...w.__ICONTROL_DEVONLY_CP_ROUTES__]
    : [];

  const devOnly = (): DevOnlySnap => {
    // allowed is runtime decision; default false unless explicitly exposed.
    const allowed = !!w.__ICONTROL_DEVONLY_ALLOWED__;
    const cpRoutes = routes;
    return { allowed, cpRoutes, cpRoutesCount: cpRoutes.length };
  };

  const exportFn = (): DiagnosticExport => {
    const d = devOnly();
    return { ok: true, ts: Date.now(), devOnly: d };
  };

  return { export: exportFn, devOnly };
}

export function installIControlDiagnosticDEVOnly(): void {
  const g = globalThis as unknown as G;

  // SSOT: do not overwrite any existing value (function OR object)
  if (typeof g.__ICONTROL_DIAGNOSTIC__ !== "undefined") return;

  const api = createApi();

  // Callable function that returns the API
  const fn = (() => api) as any;

  // Contract: function exposes stable surface
  fn.version = "ICONTROL_DIAGNOSTIC_V1";
  fn.nowISO = () => new Date().toISOString();
  fn.sanity = () => ({ ok: true, notes: [] });
  fn.mount = () => computeMountSnap();

  Object.defineProperty(g, "__ICONTROL_DIAGNOSTIC__", {

    value: fn,
    enumerable: false,
    writable: false,
    configurable: true,
  
});
}
