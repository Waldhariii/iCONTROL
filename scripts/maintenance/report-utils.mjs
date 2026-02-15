import { readdirSync, statSync, existsSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";

export function resolveReportsRoot() {
  return join(process.cwd(), "runtime", "reports");
}

export function assertNoForbiddenReportPaths() {
  const root = process.cwd();
  const forbiddenRoot = [];
  const rootEntries = existsSync(root) ? readdirSync(root) : [];
  for (const name of rootEntries) {
    if (name === "CI_REPORT.md") forbiddenRoot.push(name);
    if (name.endsWith(".log") || name.endsWith(".tmp")) forbiddenRoot.push(name);
  }
  if (forbiddenRoot.length) {
    throw new Error(`Forbidden root artifacts: ${forbiddenRoot.join(", ")}`);
  }
  const platformReports = join(root, "platform", "runtime", "reports");
  if (existsSync(platformReports)) {
    const entries = readdirSync(platformReports);
    if (entries.length > 0) {
      throw new Error("Forbidden reports path: platform/runtime/reports");
    }
  }
}

export function writeReport(namePrefix, content) {
  const reportsDir = resolveReportsRoot();
  assertNoForbiddenReportPaths();
  mkdirSync(reportsDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const name = namePrefix.endsWith(".md") ? namePrefix : `${namePrefix}_${ts}.md`;
  const path = join(reportsDir, name);
  writeFileSync(path, content.endsWith("\n") ? content : content + "\n", "utf-8");
  return path;
}

export function rotateReports(prefix, keepN = 20) {
  const reportsDir = resolveReportsRoot();
  if (!existsSync(reportsDir)) return 0;
  const files = readdirSync(reportsDir)
    .filter((f) => f.startsWith(prefix))
    .map((f) => ({ f, t: statSync(join(reportsDir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  const toRemove = files.slice(keepN);
  for (const entry of toRemove) {
    rmSync(join(reportsDir, entry.f));
  }
  return toRemove.length;
}

export function writeIndexLine(indexName, obj) {
  const reportsDir = resolveReportsRoot();
  assertNoForbiddenReportPaths();
  const indexDir = join(reportsDir, "index");
  mkdirSync(indexDir, { recursive: true });
  const path = join(indexDir, `${indexName}.jsonl`);
  writeFileSync(path, JSON.stringify(obj) + "\n", { flag: "a" });
  return path;
}
