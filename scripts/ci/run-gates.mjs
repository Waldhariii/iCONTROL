import { execSync } from "child_process";

const releaseId = process.argv[2];
if (!releaseId) {
  console.error("Usage: run-gates.mjs <releaseId>");
  process.exit(1);
}

execSync(`node governance/gates/run-gates.mjs ${releaseId}`, { stdio: "inherit" });
