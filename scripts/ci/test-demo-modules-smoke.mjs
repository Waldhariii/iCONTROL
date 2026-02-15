import { execSync } from "child_process";
import { existsSync, readdirSync } from "fs";
import { getReportsDir } from "./test-utils.mjs";

execSync("node scripts/maintenance/run-demo-modules.mjs --quick", {
  stdio: "inherit",
  env: { ...process.env, DEMO_QUICK: "1" }
});

const reportsDir = getReportsDir();
let reportExists = false;
if (existsSync(reportsDir)) {
  const files = readdirSync(reportsDir);
  reportExists = files.some((f) => f.startsWith("DEMO_REPORT_") && f.endsWith(".md"));
}
if (!reportExists) {
  throw new Error("Demo report not generated");
}

console.log("Demo modules smoke PASS");
