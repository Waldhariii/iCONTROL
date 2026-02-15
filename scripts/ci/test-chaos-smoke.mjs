import { execSync } from "child_process";
import { existsSync, readdirSync } from "fs";

execSync("node scripts/chaos/chaos-run.mjs --safe", { stdio: "inherit" });
const reports = existsSync("runtime/reports") ? readdirSync("runtime/reports").filter((f) => f.startsWith("CHAOS_REPORT_")) : [];
if (!reports.length) throw new Error("Chaos report missing");

console.log("Chaos smoke PASS");
