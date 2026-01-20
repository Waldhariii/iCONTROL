/**
 * CP API route proof check (SSOT)
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
  const proofPath = path.join("proofs", "PROOFS_API_ROUTE.json");
  mustExist(proofPath, "proofs/PROOFS_API_ROUTE.json");
  const proof = readJson(proofPath);

  const apiFile = proof.api_file;
  const moduleLoaderFile = proof.module_loader_file;
  const cpShellFile = proof.cp_shell_file;

  mustExist(apiFile, "api_file");
  mustExist(moduleLoaderFile, "module_loader_file");
  mustExist(cpShellFile, "cp_shell_file");

  // Anchors (API page)
  mustMatch(apiFile, /ICONTROL_CP_API_V2/, "ICONTROL_CP_API_V2");
  mustMatch(apiFile, /export function renderApiPage\s*\(/, "renderApiPage export");
  mustMatch(apiFile, /createPageShell\s*\(/, "createPageShell usage");
  mustMatch(apiFile, /title:\s*"API"/, "PageShell title API");
  mustMatch(apiFile, /createDataTable\s*\(/, "DataTable usage");
  mustMatch(apiFile, /createToolbar\s*\(/, "Toolbar usage");

  // Dispatch
  mustMatch(moduleLoaderFile, /rid\s+as\s+any\)\s*===\s*"api"/, "dispatch rid===api");

  // Nav mapping
  mustMatch(cpShellFile, /hash:\s*"#\/api"|location\.hash\s*=\s*"#\/api"/, "cpShell hash #/api");
  mustMatch(cpShellFile, /id:\s*"api"/, "cpShell id api");

  // Call-sites sanity
  const caller = firstMatchFile(process.cwd(), (p) => {
    if (!p.endsWith(".ts") && !p.endsWith(".tsx")) return false;
    if (path.resolve(p) === path.resolve(apiFile)) return false;
    try {
      const t = fs.readFileSync(p, "utf8");
      return t.includes("renderApiPage(") || t.includes("renderApiPageCp(") || t.includes("renderApiCp(");
    } catch { return false; }
  });
  if (!caller) {
    console.error("[FAIL] Could not find any call-site reference to renderApiPage/renderApiPageCp in repo.");
    process.exit(1);
  }

  console.log("[OK] CP api route proofs check passed");
}

main();
