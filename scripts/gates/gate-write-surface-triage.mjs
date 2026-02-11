#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { readPaths } from "../ssot/paths.mjs";

function die(code, msg) { console.error(code, msg ?? ""); process.exit(1); }

const ROOT = process.cwd();
let paths = null;
try { paths = readPaths(); } catch { paths = null; }

const surfacePath =
  (paths?.reports?.surfaceMap ? resolve(ROOT, paths.reports.surfaceMap) : resolve(ROOT, "docs/PHASE_1/APPENDIX_COMMAND_OUTPUTS/write_surface_map_report.md"));
const coveragePath =
  (paths?.reports?.coverage ? resolve(ROOT, paths.reports.coverage) : resolve(ROOT, "docs/PHASE_1/APPENDIX_COMMAND_OUTPUTS/write_gateway_coverage_report.md"));

if (!existsSync(surfacePath)) die("ERR_NO_SURFACE_REPORT", surfacePath);
if (!existsSync(coveragePath)) die("ERR_NO_COVERAGE_REPORT", coveragePath);

const surface = readFileSync(surfacePath, "utf8");
const coverage = readFileSync(coveragePath, "utf8");

/**
 * We accept multiple possible formats:
 * - "- 10 `apps/control-plane/src/...`" (surface map)
 * - plain "path (count)" lines
 */
function parseSurfaceTop(s) {
  const out = [];
  for (const raw of s.split("\n")) {
    const line = raw.trim();
    // - 10 `path`
    let m = line.match(/^\-\s+(\d+)\s+`([^`]+)`\s*$/);
    if (m) { out.push({ count: Number(m[1]), file: m[2] }); continue; }
    // path (10)
    m = line.match(/^(.+?)\s*\((\d+)\)\s*$/);
    if (m && !m[1].startsWith("#")) { out.push({ count: Number(m[2]), file: m[1].trim() }); continue; }
  }
  return out;
}

/**
 * Coverage report format may vary; we extract file paths from bullet sections.
 * This is "heuristic": we only use it to categorize (not to auto-modify).
 */
function parseCoverageFiles(s) {
  const files = new Set();
  for (const raw of s.split("\n")) {
    const line = raw.trim();
    // markdown bullet with backticks: - `path`
    const m = line.match(/^\-\s+`([^`]+)`/);
    if (m) files.add(m[1]);
  }
  return [...files];
}

function isForbiddenPath(p) {
  const lower = String(p || "").toLowerCase();
  if (lower.includes("/test/") || lower.includes("/tests/")) return true;
  if (lower.includes("/__tests__/")) return true;
  if (lower.includes("/__mocks__/")) return true;
  if (lower.includes("/mocks/")) return true;
  if (lower.includes("/fixtures/")) return true;
  if (lower.includes("/__fixtures__/")) return true;
  if (lower.includes("/__snapshots__/")) return true;
  if (/\.(test|spec)\.[cm]?[jt]sx?$/.test(lower)) return true;
  if (lower.includes(".contract.test.")) return true;
  return false;
}

const top = parseSurfaceTop(surface)
  .filter((x) => !isForbiddenPath(x.file))
  .sort((a, b) => b.count - a.count);
const covFiles = new Set(parseCoverageFiles(coverage));

function bucket(file) {
  if (file.startsWith("apps/control-plane/src/core/")) return "CORE_RUNTIME";
  if (file.startsWith("apps/control-plane/src/pages/")) return "CP_UI";
  if (file.startsWith("platform-services/")) return "PLATFORM_SERVICE";
  if (file.startsWith("modules/")) return "MODULES";
  if (file.startsWith("platform/api/")) return "SERVER";
  if (file.startsWith("scripts/")) return "SCRIPTS";
  return "OTHER";
}

const ranked = top.slice(0, 50).map(x => ({
  ...x,
  bucket: bucket(x.file),
  inCoverage: covFiles.has(x.file)
}));

const out = [];
out.push("# PHASE 2.4 BACKLOG — write surfaces triage (report-only)");
out.push("");
out.push("## Inputs (SSOT)");
out.push(`- Surface map: \`${surfacePath.replace(ROOT + "/", "")}\``);
out.push(`- Coverage: \`${coveragePath.replace(ROOT + "/", "")}\``);
out.push("");
out.push("## Top offenders (Top 50)");
out.push("");
out.push("| Rank | Hits | Bucket | In coverage | File | Recommendation |");
out.push("|---:|---:|---|---|---|---|");

ranked.forEach((r, i) => {
  const rec =
    r.bucket === "CORE_RUNTIME" ? "HIGH: prioritize canonical write points + SSOT gating" :
    r.bucket === "CP_UI" ? "MED: UI writes; keep SSR guards + legacy-first" :
    r.bucket === "PLATFORM_SERVICE" ? "HIGH: service boundary; tighten payload + correlation scope" :
    r.bucket === "SERVER" ? "HIGH: fs/fetch writes; ensure safeMode + no-op adapter in shadow" :
    r.bucket === "MODULES" ? "MED: module isolation; prefer write gateway single entrypoint" :
    "LOW: evaluate";
  out.push(`| ${i+1} | ${r.count} | ${r.bucket} | ${r.inCoverage ? "yes" : "no"} | \`${r.file}\` | ${rec} |`);
});

out.push("");
out.push("## Next action (deterministic)");
out.push("- Pick **one** file from the Top list.");
out.push("- Wire/normalize with the canonical WriteGateway shadow block (legacy-first, SSR-safe, NO-OP adapter, flag OFF by default).");
out.push("- Proof pack: gate:ssot, gate:ssot:paths, build:cp, build:app.");
out.push("- Commit scoped (single file + flags) and keep reports out of the commit.");

const backlogPath = resolve(ROOT, "docs/PHASE_2/PHASE_2_4_BACKLOG.md");
writeFileSync(backlogPath, out.join("\n"), "utf8");
console.log("OK_WRITE_SURFACE_TRIAGE_WRITTEN", backlogPath.replace(ROOT + "/", ""));
