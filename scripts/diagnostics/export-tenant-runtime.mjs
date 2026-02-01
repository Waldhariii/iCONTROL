import fs from "fs";
import path from "path";
import child_process from "child_process";

const REPO = process.cwd();

function sh(cmd) {
  try {
    return child_process.execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString("utf8").trim();
  } catch {
    return "";
  }
}

function ts() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

const TENANT_ID = process.env.TENANT_ID || process.env.ICONTROL_TENANT_ID || "default";
const ACTOR_ID = process.env.ACTOR_ID || process.env.ICONTROL_ACTOR_ID || undefined;

const OUT_REL = "_artifacts/diagnostics";
const OUT_DIR = path.join(REPO, ...OUT_REL.split("/"));
fs.mkdirSync(OUT_DIR, { recursive: true });

const outFile = path.join(OUT_DIR, `tenant-runtime_${TENANT_ID}_${ts()}.json`);

// Load TS modules through app build-friendly entry using dynamic import of compiled TS via node loader is not available.
// So we import via relative path from app/src using Node ESM + ts transpilation is not assumed.
// Instead, we use a tiny JS bridge that requires the built dist when available, OR falls back to ts-node if present.
// In this repo, tests run via vitest/ts, but node script should stay dependency-free.
// Therefore: we call node with Vite/Vitest not; we will import via "app/dist" if exists; otherwise refuse.

const appDist = path.join(REPO, "app", "dist");
const hasAppDist = fs.existsSync(appDist);

if (!hasAppDist) {
  console.error("ERR_DIAG_EXPORT_NO_APP_DIST: app/dist not found. Run: npm run -s build:prod (or gate:preflight:prod) then retry.");
  process.exit(2);
}

// Attempt to import from built bundle entry that re-exports diagnostics (expected to exist in dist assets)
// If not possible, we fail closed (prod-safe).
let snapshot = null;
try {
  // NOTE: This path may vary; keep it fail-closed and explicit.
  const mod = await import(path.join(appDist, "cp", "assets", "index.js")).catch(() => null);
  if (!mod || typeof mod.cpTenantRuntimeSnapshot !== "function") throw new Error("missing_export");
  snapshot = await mod.cpTenantRuntimeSnapshot(TENANT_ID);
} catch {
  console.error("ERR_DIAG_EXPORT_MISSING_ENTRY: cannot import cpTenantRuntimeSnapshot from built dist. Provide an explicit dist export entry for diagnostics.");
  process.exit(3);
}

const payload = {
  meta: {
    ts: new Date().toISOString(),
    tenantId: TENANT_ID,
    actorId: ACTOR_ID,
    git: {
      head: sh("git rev-parse HEAD"),
      branch: sh("git rev-parse --abbrev-ref HEAD"),
    },
    toolchain: {
      node: process.version,
      npm: sh("npm -v"),
    },
  },
  snapshot,
};

fs.writeFileSync(outFile, JSON.stringify(payload, null, 2) + "\n");
console.log("OK: exported tenant runtime evidence:");
console.log(outFile);
