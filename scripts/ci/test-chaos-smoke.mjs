import { execSync } from "child_process";
import { existsSync, readdirSync } from "fs";
import { getReportsDir, assertNoPlatformReportsPath } from "./test-utils.mjs";

execSync("node scripts/chaos/chaos-run.mjs --safe", { stdio: "inherit" });
const reportsDir = getReportsDir();
assertNoPlatformReportsPath(reportsDir);
const reports = existsSync(reportsDir) ? readdirSync(reportsDir).filter((f) => f.startsWith("CHAOS_REPORT_")) : [];
if (!reports.length) throw new Error("Chaos report missing");

console.log("Chaos smoke PASS");
