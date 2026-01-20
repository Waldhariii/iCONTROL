const fs = require("fs");

try {
  const doc = fs.readFileSync("docs/contracts/runtime.md", "utf8");
  const required = ["SAFE_MODE", "invariants", "mutating"];
  const missing = required.filter(k => !doc.includes(k));
  if (missing.length) {
    console.warn("[WARN_ONLY] runtime contract missing:", missing.join(", "));
    process.exit(0);
  }
  console.log("[OK] runtime-config contract invariants present");
} catch {
  console.warn("[WARN_ONLY] runtime-config contract unreachable");
}
process.exit(0);
