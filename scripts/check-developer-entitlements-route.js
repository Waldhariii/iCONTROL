const fs = require("fs");
const path = require("path");

function mustExist(p) { if (!fs.existsSync(p)) { console.error("[FAIL] Missing", p); process.exit(1); } }
function mustMatch(file, re, label) {
  const txt = fs.readFileSync(file, "utf8");
  if (!re.test(txt)) { console.error(`[FAIL] ${label} not found in ${file}`); process.exit(1); }
}

function main() {
  const proofPath = path.join("proofs", "PROOFS_DEVELOPER_ENTITLEMENTS_ROUTE.json");
  mustExist(proofPath);
  const proof = JSON.parse(fs.readFileSync(proofPath, "utf8"));

  const entitlementsFile = proof.entitlements_file;
  const loader = proof.module_loader_file;
  const nav = proof.nav_file;

  mustExist(entitlementsFile);
  mustExist(loader);
  mustExist(nav);

  mustMatch(entitlementsFile, /ICONTROL_CP_DEVELOPER_ENTITLEMENTS_V2/, "ICONTROL_CP_DEVELOPER_ENTITLEMENTS_V2");
  mustMatch(entitlementsFile, /export function renderDeveloperEntitlementsPage\s*\(/, "renderDeveloperEntitlementsPage export");
  mustMatch(entitlementsFile, /createPageShell\s*\(/, "createPageShell usage");

  mustMatch(loader, /rid\s+as\s+any\)\s*===\s*"developer_entitlements"/, "dispatch rid===developer_entitlements");
  mustMatch(nav, /hash:\s*"#\/developer\/entitlements"/, "nav hash #/developer/entitlements");

  console.log("[OK] CP developer entitlements route proofs check passed");
}

main();
