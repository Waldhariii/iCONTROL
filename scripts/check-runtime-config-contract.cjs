/**
 * WARN_ONLY governance check (CommonJS):
 * - Validates runtime-config contract invariants.
 * - No runtime execution; non-blocking.
 */
const fs = require("node:fs");
const http = require("node:http");

const DOC = "docs/contracts/runtime.md";
const REQUIRED = ["version", "safeMode", "features", "endpoints"];

// Doc check
if (!fs.existsSync(DOC)) {
  console.error("[FAIL] missing contract doc:", DOC);
  process.exit(1);
}

const d = fs.readFileSync(DOC, "utf8");
const missingDoc = REQUIRED.filter(k => !d.includes(k));
if (missingDoc.length) {
  console.warn("[WARN_ONLY] contract doc missing tokens:", missingDoc.join(", "));
}

// Optional endpoint probe (non-fatal)
const req = http.get("http://127.0.0.1:3000/runtime-config", { timeout: 500 }, res => {
  let buf = "";
  res.on("data", c => (buf += c));
  res.on("end", () => {
    try {
      const j = JSON.parse(buf);
      const missing = REQUIRED.filter(k => !(k in j));
      if (missing.length) {
        console.warn("[WARN_ONLY] payload missing keys:", missing.join(", "));
      } else {
        console.log("[OK] runtime-config payload contains required keys.");
      }
    } catch {
      console.warn("[WARN_ONLY] endpoint response not parseable (ignored).");
    }
    process.exit(0);
  });
});

req.on("error", () => {
  console.warn("[WARN_ONLY] runtime-config endpoint unreachable (ignored).");
  process.exit(0);
});
