/**
 * Phase AS: Scheduler one-shot — report and index under runtime/ only.
 */
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const reportsDir = join(process.cwd(), "runtime", "reports");
const schedulerDir = join(reportsDir, "scheduler");
const indexPath = join(reportsDir, "index", "scheduler_latest.jsonl");

execSync("node scripts/maintenance/scheduler.mjs", {
  stdio: "inherit",
  cwd: process.cwd()
});

const dirListing = readdirSync(schedulerDir);
const mdFiles = dirListing.filter((f) => f.startsWith("SCHEDULER_RUN_") && f.endsWith(".md"));
if (mdFiles.length === 0) throw new Error("no SCHEDULER_RUN_*.md in runtime/reports/scheduler/");
const latest = mdFiles.sort().reverse()[0];
const content = readFileSync(join(schedulerDir, latest), "utf-8");
if (!content.includes("correlation_id:") || !content.includes("Scheduler Run")) throw new Error("report content mismatch");

if (!existsSync(indexPath)) throw new Error("missing scheduler_latest.jsonl");
const lines = readFileSync(indexPath, "utf-8").trim().split("\n").filter(Boolean);
const last = lines.length ? JSON.parse(lines[lines.length - 1]) : null;
if (!last || !last.correlation_id || !Array.isArray(last.steps)) throw new Error("index entry mismatch");

console.log("Scheduler test PASS");
