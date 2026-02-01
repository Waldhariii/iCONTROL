import { describe, it, expect } from "vitest";
import { cpTenantRuntimeSnapshot } from "../platform/controlPlane/diagnostics/tenantRuntimeSnapshot";

function ts() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

describe("diagnostic export tenant runtime (evidence)", () => {
  it("writes snapshot JSON under _artifacts/diagnostics", async () => {
    const fs = await import("fs");
    const tenantId = process.env.TENANT_ID || process.env.ICONTROL_TENANT_ID || "default";

    const snapshot = await cpTenantRuntimeSnapshot(tenantId);

    const repo = process.cwd();
    const outDir = `${repo}/_artifacts/diagnostics`;
    fs.mkdirSync(outDir, { recursive: true });

    const isCI = String(process.env.CI || "").toLowerCase() === "true";
    const name = isCI ? `tenant-runtime_${tenantId}_LATEST.json` : `tenant-runtime_${tenantId}_${ts()}.json`;
    const outFile = `${outDir}/${name}`;
    fs.writeFileSync(outFile, JSON.stringify({ meta: { ts: new Date().toISOString(), tenantId }, snapshot }, null, 2) + "\n");

    expect(fs.existsSync(outFile)).toBe(true);
  });
});
