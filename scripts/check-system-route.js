/**
 * CP System route proof check
 * Fails if critical anchors are missing.
 */
const fs = require("fs");
const path = require("path");

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

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

function firstMatchFile(root, predicate) {
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    let ents;
    try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const ent of ents) {
      if (ent.name === "node_modules" || ent.name === ".git" || ent.name === "dist" || ent.name === "build") continue;
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) stack.push(p);
      else if (ent.isFile() && predicate(p)) return p;
    }
  }
  return null;
}

function main() {
  const proofPath = path.join("proofs", "PROOFS_SYSTEM_ROUTE.json");
  mustExist(proofPath, "proofs/PROOFS_SYSTEM_ROUTE.json");

  const proof = readJson(proofPath);

  const systemFile = proof.system_file;
  const moduleLoaderFile = proof.module_loader_file;
  const navFile = proof.nav_file || proof.cp_shell_file;

  mustExist(systemFile, "system_file");
  mustExist(moduleLoaderFile, "module_loader_file");
  mustExist(navFile, "nav_file");

  // Anchors (System)
  mustMatch(systemFile, /ICONTROL_CP_SYSTEM_V2/, "ICONTROL_CP_SYSTEM_V2");
  mustMatch(systemFile, /export function renderSystemPage\s*\(/, "renderSystemPage export");
  mustMatch(systemFile, /createPageShell\s*\(/, "createPageShell usage");
  mustMatch(systemFile, /title:\s*"Système"/, "PageShell title Système");

  // Anchors (Dispatch)
  mustMatch(moduleLoaderFile, /rid\s+as\s+any\)\s*===\s*"system"/, "dispatch rid===system");
  mustMatch(moduleLoaderFile, /renderSystemPageCp\s*\(\s*root\s*\)/, "renderSystemPageCp(root)");
  mustMatch(moduleLoaderFile, /renderSystemPageApp\s*\(\s*root\s*\)/, "renderSystemPageApp(root)");

  // Anchors (Nav mapping)
  mustMatch(navFile, /hash:\s*"#\/system"/, "nav hash #/system");
  mustMatch(navFile, /id:\s*"system"/, "nav id system");

  // Call-sites sanity (best-effort)
  const caller = firstMatchFile(process.cwd(), (p) => {
    if (!p.endsWith(".ts") && !p.endsWith(".tsx")) return false;
    if (p === path.resolve(systemFile)) return false;
    try {
      const t = fs.readFileSync(p, "utf8");
      return t.includes("renderSystemPage(") || t.includes("renderSystemPageCp(");
    } catch {
      return false;
    }
  });
  if (!caller) {
    console.error("[FAIL] Could not find any call-site reference to renderSystemPage/renderSystemPageCp in repo.");
    process.exit(1);
  }

  console.log("[OK] CP system route proofs check passed");
}

main();
