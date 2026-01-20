const fs = require("fs");
function must(cond, msg) { if (!cond) { console.error("FAIL:", msg); process.exit(1); } }
must(fs.existsSync("proofs/PROOFS_RUNTIME_CONFIG.md"), "missing PROOFS_RUNTIME_CONFIG.md");
must(fs.existsSync("proofs/PROOFS_RUNTIME_CONFIG.json"), "missing PROOFS_RUNTIME_CONFIG.json");
const p = JSON.parse(fs.readFileSync("proofs/PROOFS_RUNTIME_CONFIG.json", "utf8"));
must(p.kind === "ICONTROL_RUNTIME_CONFIG_V1", "wrong kind");
must(p.endpoint === "/api/runtime/config", "wrong endpoint");
console.log("OK: proofs runtime-config valid");
