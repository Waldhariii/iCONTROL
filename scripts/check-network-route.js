/**
 * CP Network route proof check (SSOT)
 * Fails if critical anchors are missing.
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
  const proofPath = path.join("proofs", "PROOFS_NETWORK_ROUTE.json");
  mustExist(proofPath, "proofs/PROOFS_NETWORK_ROUTE.json");
  const proof = readJson(proofPath);

  const networkFile = proof.network_file;
  const moduleLoaderFile = proof.module_loader_file;
  const cpShellFile = proof.cp_shell_file;

  mustExist(networkFile, "network_file");
  mustExist(moduleLoaderFile, "module_loader_file");
  mustExist(cpShellFile, "cp_shell_file");

  // Anchors (Network page)
  mustMatch(networkFile, /ICONTROL_CP_NETWORK_V2/, "ICONTROL_CP_NETWORK_V2");
  mustMatch(networkFile, /export function renderNetworkPage\s*\(/, "renderNetworkPage export");
  mustMatch(networkFile, /createPageShell\s*\(/, "createPageShell usage");
  mustMatch(networkFile, /title:\s*"Network"/, "PageShell title Network");
  mustMatch(networkFile, /createDataTable\s*\(/, "DataTable usage");
  mustMatch(networkFile, /createToolbar\s*\(/, "Toolbar usage");

  // Dispatch
  mustMatch(moduleLoaderFile, /rid\s+as\s+any\)\s*===\s*"network"/, "dispatch rid===network");

  // Nav mapping
  mustMatch(cpShellFile, /hash:\s*"#\/network"|location\.hash\s*=\s*"#\/network"/, "cpShell hash #/network");
  mustMatch(cpShellFile, /id:\s*"network"/, "cpShell id network");

  // Call-sites sanity
  const caller = firstMatchFile(process.cwd(), (p) => {
    if (!p.endsWith(".ts") && !p.endsWith(".tsx")) return false;
    if (path.resolve(p) === path.resolve(networkFile)) return false;
    try {
      const t = fs.readFileSync(p, "utf8");
      return t.includes("renderNetworkPage(") || t.includes("renderNetworkPageCp(") || t.includes("renderNetworkCp(");
    } catch { return false; }
  });
  if (!caller) {
    console.error("[FAIL] Could not find any call-site reference to renderNetworkPage/renderNetworkPageCp in repo.");
    process.exit(1);
  }

  console.log("[OK] CP network route proofs check passed");
}

main();
