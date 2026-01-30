#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * gate:gates:sanity
 * Report-only sanity checks for gate scripts:
 * - Shebang must be first line if present
 * - No duplicate imports (same module imported twice)
 * Exit: always 0 (report-only), but logs WARN_* if anomalies.
 */

const GATES_DIR = "scripts/gates";

function checkGateFile(filePath) {
  const issues = [];
  let content;
  
  try {
    content = readFileSync(filePath, "utf8");
  } catch (err) {
    return [`ERR_READ_FILE: ${filePath} (${String(err)})`];
  }

  const lines = content.split("\n");
  
  // Check 1: Shebang must be first line if present
  const shebangIdx = lines.findIndex(l => l.startsWith("#!/usr/bin/env node"));
  if (shebangIdx >= 0 && shebangIdx !== 0) {
    issues.push(`WARN_SHEBANG_NOT_FIRST: ${filePath} (line ${shebangIdx + 1}, should be 1)`);
  }
  
  // Check 2: No duplicate imports (same module imported twice)
  const imports = [];
  const importModules = new Set();
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("import ")) {
      // Extract module path (heuristic: between "from" and quote)
      const fromMatch = line.match(/from\s+['"]([^'"]+)['"]/);
      if (fromMatch) {
        const module = fromMatch[1];
        if (importModules.has(module)) {
          issues.push(`WARN_DUPLICATE_IMPORT: ${filePath} (line ${i + 1}, module "${module}" imported multiple times)`);
        } else {
          importModules.add(module);
        }
      }
      imports.push({ line: i + 1, content: line });
    }
  }

  return issues;
}

function main() {
  let totalIssues = 0;
  
  try {
    const files = readdirSync(GATES_DIR)
      .filter(f => f.endsWith(".mjs"))
      .map(f => join(GATES_DIR, f))
      .filter(f => {
        try {
          return statSync(f).isFile();
        } catch {
          return false;
        }
      });

    for (const file of files) {
      const issues = checkGateFile(file);
      if (issues.length > 0) {
        for (const issue of issues) {
          console.warn(issue);
          totalIssues++;
        }
      }
    }

    if (totalIssues === 0) {
      console.log("OK_GATES_SANITY: all gate scripts pass sanity checks");
    } else {
      console.warn(`WARN_GATES_SANITY: ${totalIssues} issue(s) found (report-only, non-blocking)`);
    }
  } catch (err) {
    console.error("ERR_GATES_SANITY_SCAN", String(err));
    // Still exit 0 (report-only)
  }
  
  // Always exit 0 (report-only)
  process.exit(0);
}

main();
