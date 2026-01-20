const fs = require("fs");

const cfg = fs.existsSync("runtime-config.json")
  ? JSON.parse(fs.readFileSync("runtime-config.json","utf8"))
  : {};

const mode = cfg.SAFE_MODE_ENFORCEMENT || "WARN_ONLY";

if (mode === "FAIL") {
  console.error("[FAIL] SAFE_MODE enforcement active");
  process.exit(1);
}

console.log("[WARN_ONLY] SAFE_MODE enforcement not strict");
process.exit(0);
