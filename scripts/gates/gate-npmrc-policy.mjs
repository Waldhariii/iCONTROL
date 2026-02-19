import fs from "node:fs";

const path = ".npmrc";
if (!fs.existsSync(path)) {
  console.log("[gate:npmrc] OK: no .npmrc at repo root");
  process.exit(0);
}

const raw = fs.readFileSync(path, "utf8");
const lines = raw
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#") && !l.startsWith(";"));

const forbiddenKeys = new Set([
  "auto-install-peers",
]);

const hits = [];
for (const l of lines) {
  const m = l.match(/^([A-Za-z0-9_.-]+)\s*=/);
  if (!m) continue;
  const key = m[1];
  if (forbiddenKeys.has(key)) hits.push({ key, line: l });
}

if (hits.length) {
  console.error("[gate:npmrc] FAIL: forbidden keys detected in .npmrc");
  for (const h of hits) console.error(`- ${h.key}: ${h.line}`);
  console.error("Action: remove forbidden keys from repo .npmrc.");
  process.exit(1);
}

console.log("[gate:npmrc] OK");
