#!/usr/bin/env node
const fs = require("node:fs");

function read(fp) { return fs.readFileSync(fp, "utf8"); }
function write(fp, s) { fs.writeFileSync(fp, s); }

let changed = 0;

function patchLocalAuth(fp) {
  if (!fs.existsSync(fp)) return;
  const src = read(fp);

  // Replace hardcoded BOOTSTRAP_USERS with DEV-only injected map
  const reUsers = /const\s+BOOTSTRAP_USERS\s*:\s*Record<[^>]*>\s*=\s*\{[\s\S]*?\n\};\n/;
  let out = src;

  if (reUsers.test(out)) {
    out = out.replace(reUsers, `// SECURITY: Bootstrap users are DEV-only and must be injected, never hardcoded.
// Provide JSON via VITE_ICONTROL_DEV_BOOTSTRAP_USERS (or runtime-config) when needed.
// Example (DEV only):
// {"Admin":{"password":"<one-time>","role":"ADMIN"}}
const BOOTSTRAP_USERS: Record<string, { password: string; role: Role }> = (() => {
  try {
    const isDev = (import.meta as any)?.env?.DEV === true;
    if (!isDev) return {};
    const raw =
      (import.meta as any)?.env?.VITE_ICONTROL_DEV_BOOTSTRAP_USERS ||
      (globalThis as any)?.__ICONTROL_DEV_BOOTSTRAP_USERS__;
    if (!raw || typeof raw !== "string") return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, { password: string; role: Role }>;
  } catch {
    return {};
  }
})();\n`);
    changed++;
  }

  // Gate __icontrolDevLogin exposure to DEV only
  const reDevLoginAssign = /\(window as any\)\.__icontrolDevLogin\s*=\s*\([\s\S]*?\n\};\n/;
  if (reDevLoginAssign.test(out)) {
    out = out.replace(reDevLoginAssign, `// SECURITY: DEV helper is only exposed in DEV builds; never in production.
if ((import.meta as any)?.env?.DEV === true) {
  (window as any).__icontrolDevLogin = (username: string, role: string) => {
    try {
      console.warn("[DEV] __icontrolDevLogin invoked (DEV-only).");
      // Keep your existing internal wiring here if needed.
    } catch {}
  };
}\n`);
    changed++;
  }

  // If any weak literals remain, redact
  out = out.replace(/password:\s*"1234"/g, 'password: "<DEV_ONLY>"');

  if (out !== src) write(fp, out);
}

function patchUserData(fp) {
  if (!fs.existsSync(fp)) return;
  const src = read(fp);
  let out = src;

  // Remove explicit password examples in comments
  out = out.replace(/\/\/\s*Hash\s*g[eé]n[eé]r[eé]\s*avec:\s*password\s*=\s*".*?"\s*\n/g, "// Hash generated with an internal test vector (redacted)\n");

  if (out !== src) { write(fp, out); changed++; }
}

function patchDocsAndPatchesTracked(paths) {
  for (const fp of paths) {
    if (!fs.existsSync(fp)) continue;
    if (!/\.(md|txt|patch|diff)$/i.test(fp)) continue;
    const src = read(fp);
    let out = src;

    out = out.replace(/Dany123456@/g, "<REDACTED_PASSWORD>");
    out = out.replace(/\bpassword:\s*"(1234|admin|sysadmin|developer)"\b/g, 'password: "<REDACTED>"');

    if (out !== src) { write(fp, out); changed++; }
  }
}

const trackedListFile = process.argv[2];
let tracked = [];
if (trackedListFile && fs.existsSync(trackedListFile)) {
  tracked = read(trackedListFile).split("\n").map(s => s.trim()).filter(Boolean);
}

patchLocalAuth("app/src/localAuth.ts");
patchUserData("app/src/core/security/userData.ts");
patchDocsAndPatchesTracked(tracked);

console.log("[OK] sanitizer executed; files touched:", changed);
