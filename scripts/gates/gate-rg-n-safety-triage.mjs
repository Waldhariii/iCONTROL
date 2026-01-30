#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { readPaths } from "../ssot/paths.mjs";

const paths = (() => {
  try {
    return readPaths();
  } catch {
    return null;
  }
})();
const REPORT = paths?.rgNSafetyReport || paths?.reports?.rgNSafety || "rg_n_safety_report.md";
const BACKLOG = "rg_n_safety_backlog.md";
if (!existsSync(REPORT)) {
  try {
    // Report-only: generate the report if missing
    execFileSync("npm", ["-s", "run", "-S", "gate:rg-n-safety"], { stdio: "inherit" });
  } catch {
    // ignore; we will validate existence right after
  }
}
if (!existsSync(REPORT)) {
  console.error("ERR_RG_N_TRIAGE_NO_REPORT", REPORT);
  process.exit(2);
}


const ROOT = process.cwd();
const raw = readFileSync(REPORT, "utf8");

// Accept both:
// 1) bullets like "- scripts/foo.zsh:HITS=4"
// 2) plain lines like "scripts/foo.zsh:HITS=4"
const lines = raw
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#"));

const entries = [];
for (const l of lines) {
  const s = l.startsWith("-") ? l.replace(/^-+\s*/, "") : l;
  // Format: path:LABEL=...
  const m = s.match(/^([^:\s]+):([A-Z_]+)=(\d+)\b/);
  if (!m) continue;
  const file = m[1];
  const label = m[2];
  const hits = Number(m[3] || "0");
  if (!Number.isFinite(hits) || hits <= 0) continue;
  entries.push({ file, label, hits });
}

const byFile = new Map();
for (const e of entries) {
  const cur = byFile.get(e.file) || { file: e.file, hits: 0, labels: new Set() };
  cur.hits += e.hits;
  cur.labels.add(e.label);
  byFile.set(e.file, cur);
}

const sorted = Array.from(byFile.values())
  .sort((a, b) => (b.hits - a.hits) || a.file.localeCompare(b.file));

const out = [];
out.push("# rg -n safety backlog");
out.push("");
out.push(`- Source report: \`${REPORT}\``);
out.push(`- Total files impacted: ${sorted.length}`);
out.push("");
out.push("## Prioritized list");
out.push("");
for (const x of sorted) {
  const labels = Array.from(x.labels).sort().join(", ");
  out.push(`- ${x.hits} hits — \`${x.file}\` (labels: ${labels})`);
}
out.push("");

writeFileSync(resolve(ROOT, BACKLOG), out.join("\n"), "utf8");
console.log("OK_RG_N_TRIAGE_WRITTEN rg_n_safety_backlog.md");
