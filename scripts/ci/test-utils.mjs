import { mkdtempSync, readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const s = join(src, entry);
    const d = join(dest, entry);
    if (s.includes("/changes/snapshots")) continue;
    if (s.includes("/runtime/preview")) continue;
    const st = statSync(s);
    if (st.isDirectory()) copyDir(s, d);
    else writeFileSync(d, readFileSync(s));
  }
}

export function createTempSsot() {
  const temp = mkdtempSync(join(tmpdir(), "icontrol-ssot-"));
  const ssotDest = join(temp, "platform", "ssot");
  copyDir("./platform/ssot", ssotDest);
  try {
    const freezePath = join(ssotDest, "governance", "change_freeze.json");
    const freeze = JSON.parse(readFileSync(freezePath, "utf-8"));
    freeze.enabled = false;
    writeFileSync(freezePath, JSON.stringify(freeze, null, 2) + "\n");
  } catch {
    // ignore if change_freeze not present
  }
  return {
    ssotDir: ssotDest,
    cleanup() {
      rmSync(temp, { recursive: true, force: true });
    }
  };
}

export function getReportsDir() {
  return join(process.cwd(), "runtime", "reports");
}

export function assertNoPlatformReportsPath(str) {
  if (String(str).includes("platform/runtime/reports")) {
    throw new Error("Forbidden reports path: platform/runtime/reports");
  }
}

export function rotateReports({ prefix, keep, dir }) {
  const reportsDir = dir || getReportsDir();
  if (!existsSync(reportsDir)) return 0;
  const files = readdirSync(reportsDir)
    .filter((f) => f.startsWith(prefix))
    .map((f) => ({ f, t: statSync(join(reportsDir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  const toRemove = files.slice(keep);
  for (const entry of toRemove) {
    rmSync(join(reportsDir, entry.f));
  }
  return toRemove.length;
}

export async function waitForServer(url, timeoutMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res) return true;
    } catch {
      // ignore until timeout
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Server not ready: ${url}`);
}
