// @ts-nocheck
/** @vitest-environment jsdom */
import { describe, it, expect, vi } from "vitest";
import { renderSystemCacheAudit } from "./cache-audit";

describe("system cache-audit section (ui)", () => {
  it("renders actions and allows copy (redacted) to clipboard", async () => {
    
    const obsCalls: any[] = [];
    (globalThis as any).recordObs = (e: any) => { obsCalls.push(e); };
const host = document.createElement("div");

    const writeText = vi.fn().mockResolvedValue(undefined);
    (globalThis as any).navigator = { clipboard: { writeText } };

    expect(() => renderSystemCacheAudit(host)).not.toThrow();

    const btns = Array.from(host.querySelectorAll("button")).map((b) => (b as HTMLButtonElement).textContent || "");
    expect(btns.some((t) => /Refresh/i.test(t))).toBe(true);
    
    const refreshBtn = Array.from(host.querySelectorAll("button")).find((b) => /Refresh/i.test((b as any).textContent || ""));
    expect(refreshBtn).toBeTruthy();
    await (refreshBtn as HTMLButtonElement).onclick?.(new MouseEvent("click") as any);

    // OBS refresh emitted (best-effort): validate shape and code
    expect(obsCalls.some((e) => e && e.code === "AUDIT_CACHE_REFRESH")).toBe(true);
expect(btns.some((t) => /Copy redacted JSON/i.test(t))).toBe(true);

    const copyBtn = Array.from(host.querySelectorAll("button")).find((b) => /Copy redacted JSON/i.test((b as any).textContent || ""));
    expect(copyBtn).toBeTruthy();

    await (copyBtn as HTMLButtonElement).onclick?.(new MouseEvent("click") as any);
    expect(writeText).toHaveBeenCalledTimes(1);
  });
});
