/**
 * CI Guard: Fail if extensions/** imports from platform/core/governance/runtime internals.
 * Business surfaces must stay extension-owned; no core leak.
 */
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const EXT_DIR = join(ROOT, "extensions");

const FORBIDDEN_IMPORT_PATTERNS = [
  /from\s+['"]\.\.\/.*platform\//,
  /from\s+['"]platform\//,
  /require\s*\(\s*['"]platform\//,
  /from\s+['"]\.\.\/.*core\//,
  /from\s+['"]core\//,
  /require\s*\(\s*['"]core\//,
  /from\s+['"]\.\.\/.*governance\//,
  /from\s+['"]governance\//,
  /require\s*\(\s*['"]governance\//,
  /from\s+['"]\.\.\/.*runtime\//,
  /from\s+['"]runtime\//,
  /require\s*\(\s*['"]runtime\//
];

const EXTS = [".mjs", ".js", ".ts"];
function collectFiles(dir, out = []) {
  try {
    if (!statSync(dir).isDirectory()) return out;
  } catch {
    return out;
  }
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    try {
      const st = statSync(full);
      if (st.isDirectory()) {
        if (name !== "node_modules" && name !== ".git") collectFiles(full, out);
      } else if (EXTS.some((e) => name.endsWith(e))) out.push(full);
    } catch {}
  }
  return out;
}

function main() {
  const leaks = [];
  const files = collectFiles(EXT_DIR);
  for (const file of files) {
    const content = readFileSync(file, "utf-8");
    const rel = file.replace(ROOT + "/", "");
    for (const re of FORBIDDEN_IMPORT_PATTERNS) {
      if (re.test(content)) {
        leaks.push({ file: rel, pattern: String(re) });
      }
    }
  }
  if (leaks.length) {
    console.error("ERR: extensions must not import from platform/core/governance/runtime:");
    for (const { file } of leaks) console.error("  ", file);
    process.exit(1);
  }
  console.log("OK: no extension→core/platform leak detected.");
}

main();
