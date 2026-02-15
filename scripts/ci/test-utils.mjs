import { mkdtempSync, readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { createHmac, createHash, randomUUID } from "crypto";

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
  try {
    const activePath = join(ssotDest, "changes", "active_release.json");
    const active = JSON.parse(readFileSync(activePath, "utf-8"));
    active.active_release_id = "dev-001";
    active.active_env = "dev";
    active.updated_at = new Date().toISOString();
    active.updated_by = "ci";
    writeFileSync(activePath, JSON.stringify(active, null, 2) + "\n");
  } catch {
    // ignore if active_release not present
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

export function scanForSecrets({ paths, patterns, allowlist } = {}) {
  const allow = allowlist || ["sec:ref:"];
  const pats = patterns || [
    /sk_live_/i,
    /Bearer\s+[A-Za-z0-9\-_\.=]+/i,
    /Authorization:\s*Bearer\s+[A-Za-z0-9\-_\.=]+/i,
    /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/,
    /AKIA[0-9A-Z]{16}/,
    /-----BEGIN [A-Z ]+ PRIVATE KEY-----/,
    /xoxb-[A-Za-z0-9-]+/i,
    /[A-Za-z0-9+/]{200,}={0,2}/
  ];
  const hits = [];
  const scanFile = (filePath) => {
    let txt = readFileSync(filePath, "utf-8");
    if (filePath.endsWith(".json")) {
      try {
        const obj = JSON.parse(txt);
        const scrub = (o) => {
          if (!o || typeof o !== "object") return;
          for (const [k, v] of Object.entries(o)) {
            if (typeof v === "object") scrub(v);
            const key = String(k).toLowerCase();
            if (key.includes("signature") || key.includes("checksum") || key.includes("hash")) {
              o[k] = "__redacted__";
            }
          }
        };
        scrub(obj);
        txt = JSON.stringify(obj);
      } catch {
        // keep original
      }
    }
    if (allow.some((a) => txt.includes(a))) return;
    for (const re of pats) {
      const m = txt.match(re);
      if (m) {
        hits.push({ file: filePath, match: re.toString() });
        break;
      }
    }
  };
  const scanDir = (dir) => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) scanDir(full);
      else scanFile(full);
    }
  };
  for (const p of paths || []) scanDir(p);
  return hits;
}

export function buildS2SHmacHeaders({ principalId, secret, method, path, body }) {
  const ts = Date.now().toString();
  const bodySha = createHash("sha256").update(body || "").digest("hex");
  const canonical = `${ts}.${method}.${path}.${bodySha}`;
  const sig = createHmac("sha256", secret).update(canonical).digest("base64");
  return {
    "x-s2s-principal": principalId,
    "x-s2s-timestamp": ts,
    "x-s2s-signature": sig,
    "x-request-id": randomUUID()
  };
}

export async function getS2SToken({ baseUrl, principalId, secret, scopes }) {
  const body = JSON.stringify({ principal_id: principalId, requested_scopes: scopes, audience: "backend-api" });
  const headers = buildS2SHmacHeaders({ principalId, secret, method: "POST", path: "/api/auth/token", body });
  const res = await fetch(`${baseUrl}/api/auth/token`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  const data = await res.json();
  return data.access_token;
}
