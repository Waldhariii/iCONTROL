#!/usr/bin/env node
/**
 * Gate (report-only): Write surface map for prioritization.
 * Scans for storage and write-like operations and ranks by file hit count.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve, relative } from "node:path";
import { readPaths } from "../ssot/paths.mjs";

const ROOT = process.cwd();
const paths = readPaths();
const REPORT = resolve(ROOT, paths.reports.surfaceMap);

const TARGETS = paths.roots.length ? paths.roots : ["apps/control-plane/src", "modules", "platform-services", "server"]; // read-only scan
const EXCLUDES = ["node_modules", "dist", "coverage"]; // coarse excludes

const PATTERNS = [
  // STORAGE
  String.raw`\b(?:window\.)?(?:localStorage|sessionStorage)\.(?:setItem|removeItem|clear)\s*\(`,
  // COOKIE
  String.raw`\bdocument\.cookie\s*=`,
  // INDEXEDDB (broad signals; still useful for migration candidates)
  String.raw`\bindexedDB\b`,
  // FS (node)
  String.raw`\bfs\.(?:writeFileSync|writeFile|appendFileSync|appendFile|renameSync|rename|rmSync|rm|unlinkSync|unlink)\s*\(`,
  // NETWORK write-ish
  String.raw`\bnavigator\.sendBeacon\s*\(`,
  String.raw`\baxios\.(?:post|put|patch|delete|request)\s*\(`,
  // fetch with method hints (still broad)
  String.raw`\bfetch\s*\(`,
];

function runRg(targets) {
  const args = [
    "--pcre2",
    "--no-heading",
    "--with-filename",
    "--line-number",
    "--color",
    "never",
    ...PATTERNS.flatMap((p) => ["-e", p]),
  ];
  try {
    return execFileSync("rg", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (e) {
    return (e.stdout || "").toString();
  }
}

const missingTargets = TARGETS.filter((t) => !existsSync(resolve(ROOT, t)));
const activeTargets = TARGETS.filter((t) => existsSync(resolve(ROOT, t)));
const hitsRaw = runRg(activeTargets).trim();
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
  `- Missing targets (skipped): ${missingTargets.length ? missingTargets.join(", ") : "none"}`,
  `- Excludes: ${EXCLUDES.join(", ")}`,
  `- Patterns:`,
  ...PATTERNS.map((p) => `  - \`${p}\``),
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

mkdirSync(resolve(ROOT, dirname(paths.reports.surfaceMap)), { recursive: true });
writeFileSync(REPORT, body, "utf8");

console.log(`OK: report generated at ${relative(ROOT, REPORT)}`);
