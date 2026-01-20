/**
 * CP Account route proof check (SSOT)
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

function firstMatchFile(root, predicate) {
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    let ents;
    try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const ent of ents) {
      if (["node_modules", ".git", "dist", "build"].includes(ent.name)) continue;
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) stack.push(p);
      else if (ent.isFile() && predicate(p)) return p;
    }
  }
  return null;
}

function main() {
  const proofPath = path.join("proofs", "PROOFS_ACCOUNT_ROUTE.json");
  mustExist(proofPath, "proofs/PROOFS_ACCOUNT_ROUTE.json");
  const proof = readJson(proofPath);

  const accountFile = proof.account_file;
  const moduleLoaderFile = proof.module_loader_file;
  const cpShellFile = proof.cp_shell_file;

  mustExist(accountFile, "account_file");
  mustExist(moduleLoaderFile, "module_loader_file");
  mustExist(cpShellFile, "cp_shell_file");

  mustMatch(accountFile, /ICONTROL_CP_ACCOUNT_V2/, "ICONTROL_CP_ACCOUNT_V2");
  mustMatch(accountFile, /export function renderAccountPage\s*\(/, "renderAccountPage export");
  mustMatch(accountFile, /createPageShell\s*\(/, "createPageShell usage");

  mustMatch(moduleLoaderFile, /rid\s+as\s+any\)\s*===\s*"account"/, "dispatch rid===account");

  mustMatch(cpShellFile, /navigate\("#\/account"\)/, "cpToolboxShell hash #/account");

  const caller = firstMatchFile(process.cwd(), (p) => {
    if (!p.endsWith(".ts") && !p.endsWith(".tsx")) return false;
    if (path.resolve(p) === path.resolve(accountFile)) return false;
    try {
      const t = fs.readFileSync(p, "utf8");
      return t.includes("renderAccountPage(") || t.includes("renderAccount(");
    } catch { return false; }
  });
  if (!caller) {
    console.error("[FAIL] Could not find any call-site reference to renderAccount/renderAccountPage in repo.");
    process.exit(1);
  }

  console.log("[OK] CP account route proofs check passed");
}

main();
