import { execSync } from "node:child_process";

try {
  execSync("node --check apps/control-plane/public/app.js", {
    stdio: "inherit",
    cwd: process.cwd()
  });
  console.log("PASS control-plane syntax");
} catch {
  console.error("FAIL control-plane syntax");
  process.exit(1);
}
