/**
 * CP Developer route proof check
 */
const fs = require("fs");
const path = require("path");

function readJson(p) { return JSON.parse(fs.readFileSync(p, "utf8")); }
function mustExist(p, label) {
  if (!fs.existsSync(p)) { console.error(`[FAIL] Missing ${label}: ${p}`); process.exit(1); }
}
function mustMatch(file, re, label) {
  const txt = fs.readFileSync(file, "utf8");
  if (!re.test(txt)) { console.error(`[FAIL] ${label} not found in ${file}`); process.exit(1); }
}

function main() {
  const proofPath = path.join("proofs", "PROOFS_DEVELOPER_ROUTE.json");
  mustExist(proofPath, "proofs/PROOFS_DEVELOPER_ROUTE.json");
  const proof = readJson(proofPath);

  const devFile = proof.developer_file;
  const loader = proof.module_loader_file;
  const nav = proof.nav_file;

  mustExist(devFile, "developer_file");
  mustExist(loader, "module_loader_file");
  mustExist(nav, "nav_file");

  mustMatch(devFile, /ICONTROL_CP_DEVELOPER_V2/, "ICONTROL_CP_DEVELOPER_V2");
  mustMatch(devFile, /export function renderDeveloperPage\s*\(/, "renderDeveloperPage export");
  mustMatch(devFile, /createPageShell\s*\(/, "createPageShell usage");
  mustMatch(devFile, /title:\s*"Developer"/, "PageShell title Developer");
  mustMatch(loader, /rid\s+as\s+any\)\s*===\s*"developer"/, "dispatch rid===developer");
  mustMatch(nav, /hash:\s*"#\/developer"/, "nav hash #/developer");

  console.log("[OK] CP developer route proofs check passed");
}
main();
