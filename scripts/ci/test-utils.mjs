import { mkdtempSync, readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, rmSync } from "fs";
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
