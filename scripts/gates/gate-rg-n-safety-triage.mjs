#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = process.cwd();
const reportCandidates = [
  "docs/PHASE_1/APPENDIX_COMMAND_OUTPUTS/rg_n_safety_report.md",
  "rg_n_safety_report.md",
];

function pickReport() {
  for (const p of reportCandidates) {
    try { if (existsSync(p)) return p; } catch {}
  }
  // last resort: caller can pass path as argv[2]
  const arg = process.argv[2];
  if (arg && existsSync(arg)) return arg;
  return null;
}

const reportPath = pickReport();
if (!reportPath) {
  console.error("ERR_RG_N_TRIAGE_NO_REPORT");
  process.exit(1);
}

const raw = readFileSync(reportPath, "utf8");

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
out.push(`- Source report: \`${reportPath}\``);
out.push(`- Total files impacted: ${sorted.length}`);
out.push("");
out.push("## Prioritized list");
out.push("");
for (const x of sorted) {
  const labels = Array.from(x.labels).sort().join(", ");
  out.push(`- ${x.hits} hits — \`${x.file}\` (labels: ${labels})`);
}
out.push("");

writeFileSync(resolve(ROOT, "rg_n_safety_backlog.md"), out.join("\n"), "utf8");
console.log("OK_RG_N_TRIAGE_WRITTEN rg_n_safety_backlog.md");
