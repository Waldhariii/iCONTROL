#!/usr/bin/env node
/**
 * Gate (report-only): Write surface map for prioritization.
 * Scans for storage and write-like operations and ranks by file hit count.
 */
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, relative } from "node:path";

const ROOT = process.cwd();
const REPORT = resolve(ROOT, "docs/PHASE_1/APPENDIX_COMMAND_OUTPUTS/write_surface_map_report.md");

const TARGETS = ["app/src", "modules", "platform-services", "server"]; // read-only scan
const EXCLUDES = ["node_modules", "dist", "coverage"]; // coarse excludes

const PATTERN = String.raw`
localStorage\.setItem\s*\(|sessionStorage\.setItem\s*\(|
\bfetch\s*\(.*?\)\s*(?:\n|\r|\r\n)?[^\n]*method\s*:\s*"(POST|PUT|PATCH|DELETE)"|
\b(writeFileSync|writeFile|appendFile|appendFileSync)\s*\(
`;

function runRg() {
  const args = [
    "-n",
    "--no-heading",
    "--color",
    "never",
    PATTERN.replace(/\n/g, ""),
    ...TARGETS,
    ...EXCLUDES.map((p) => `-g!${p}/**`),
  ];
  const cmd = `rg ${args.map((a) => `"${a}"`).join(" ")}`;
  try {
    return execSync(cmd, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    return (e.stdout || "").toString();
  }
}

const hitsRaw = runRg().trim();
const lines = hitsRaw ? hitsRaw.split("\n") : [];

const counts = new Map();
for (const line of lines) {
  const file = line.split(":")[0];
  counts.set(file, (counts.get(file) || 0) + 1);
}

const sorted = Array.from(counts.entries())
  .sort((a, b) => b[1] - a[1])
  .map(([file, count]) => ({ file, count }));

const topLines = sorted.slice(0, 50).map((x) => `- ${x.count} \`${x.file}\``);

const body = [
  "# Write Surface Map (report-only)",
  "",
  `- Date: ${new Date().toISOString()}`,
  `- Targets: ${TARGETS.join(", ")}`,
  `- Excludes: ${EXCLUDES.join(", ")}`,
  `- Pattern: ${PATTERN.replace(/\n/g, "").trim()}`,
  `- Total hits: ${lines.length}`,
  "",
  "## Top Offenders (by file hit count)",
  "",
  ...(topLines.length ? topLines : ["_No matches._"]),
  "",
  "## Raw Matches (first 200)",
  "",
  lines.length ? "```txt\n" + lines.slice(0, 200).join("\n") + "\n```" : "_No matches._",
  "",
  "## Notes",
  "- Report-only: does not block commits.",
  "- Use this list to choose next Write Gateway pilots.",
  "",
].join("\n");

mkdirSync(resolve(ROOT, "docs/PHASE_1/APPENDIX_COMMAND_OUTPUTS"), { recursive: true });
writeFileSync(REPORT, body, "utf8");

console.log(`OK: report generated at ${relative(ROOT, REPORT)}`);
