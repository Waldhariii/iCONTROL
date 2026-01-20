/**
 * CP Dashboard route proof check
 */
const fs = require("fs");
const path = require("path");

function mustExist(p, label) {
  if (!fs.existsSync(p)) {
    console.error(`[FAIL] Missing ${label}: ${p}`);
    process.exit(1);
  }
}
function mustMatch(file, re, label) {
  const txt = fs.readFileSync(file, "utf8");
  if (!re.test(txt)) {
    console.error(`[FAIL] ${label} not found in ${file}`);
    process.exit(1);
  }
}

function main() {
  const proofPath = path.join("proofs", "PROOFS_DASHBOARD_ROUTE.json");
  mustExist(proofPath, "proofs/PROOFS_DASHBOARD_ROUTE.json");
  const proof = JSON.parse(fs.readFileSync(proofPath, "utf8"));

  const dash = proof.dashboard_file;
  const loader = proof.module_loader_file;
  const nav = proof.nav_file;

  mustExist(dash, "dashboard_file");
  mustExist(loader, "module_loader_file");
  mustExist(nav, "nav_file");

  mustMatch(dash, /ICONTROL_CP_DASHBOARD_V3/, "ICONTROL_CP_DASHBOARD_V3");
  mustMatch(dash, /API Testing/, "API Testing title");
  mustMatch(dash, /Network Activity/, "Network Activity title");
  mustMatch(dash, /createDonutGauge\s*\(/, "donut gauge usage");
  mustMatch(dash, /createLineChart\s*\(/, "line chart usage");

  mustMatch(loader, /rid\s*(?:as\s+any\)\s*)?===\s*"dashboard"/, "dispatch rid===dashboard");
  mustMatch(nav, /hash:\s*"#\/dashboard"/, "nav #/dashboard");

  console.log("[OK] CP dashboard route proofs check passed");
}
main();
