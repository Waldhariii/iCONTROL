const fs = require("fs");
const path = require("path");

function mustExist(p) { if (!fs.existsSync(p)) { console.error("[FAIL] Missing", p); process.exit(1); } }
function mustMatch(file, re, label) {
  const txt = fs.readFileSync(file, "utf8");
  if (!re.test(txt)) { console.error(`[FAIL] ${label} not found in ${file}`); process.exit(1); }
}

function main() {
  const proofPath = path.join("proofs", "PROOFS_VERIFICATION_ROUTE.json");
  mustExist(proofPath);
  const proof = JSON.parse(fs.readFileSync(proofPath, "utf8"));

  const entry = proof.verification_entry;
  mustExist(entry);
  mustExist(proof.module_loader_file);
  mustExist(proof.nav_file);

  mustMatch(entry, /ICONTROL_CP_VERIFICATION_V2/, "ICONTROL_CP_VERIFICATION_V2");
  mustMatch(entry, /createPageShell\s*\(/, "createPageShell usage");
  mustMatch(entry, /renderVerificationPage/, "renderVerificationPage export");

  mustMatch(proof.module_loader_file, /rid\s+as\s+any\)\s*===\s*"verification"/, "dispatch rid===verification");
  mustMatch(proof.nav_file, /hash:\s*"#\/verification"/, "nav hash #/verification");

  console.log("[OK] CP verification route proofs check passed");
}

main();
