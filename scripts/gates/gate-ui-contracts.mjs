#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const REPORTS_DIR = path.join(ROOT, "_REPORTS");
const NOW = new Date().toISOString().replace(/[:.]/g, "-");
const REPORT_PATH = path.join(REPORTS_DIR, `ui-contracts-report-${NOW}.md`);

function sh(cmd, opts = {}) {
  return execSync(cmd, { cwd: ROOT, stdio: "pipe", encoding: "utf8", ...opts });
}
function fileExists(p) {
  try { fs.accessSync(p, fs.constants.F_OK); return true; } catch { return false; }
}
function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}
function readFile(p) {
  return fs.readFileSync(p, "utf8");
}
function writeFile(p, s) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, s, "utf8");
}

const UI_CORE_DIR = "app/src/core/ui";
const UI_SHARED_DIR = "modules/core-system/ui/frontend-ts/pages/_shared";
const CP_CSS = "app/src/styles/STYLE_ADMIN_FINAL.css";
const REGISTRY_TS = path.join(UI_CORE_DIR, "registry.ts");

// Allowlist: inline styles we accept (dynamic-only)
const INLINE_ALLOWLIST = [
  "app/src/core/ui/skeletonLoader.ts", // allow: height only
  // Extend explicitly if needed
];

// Exclusions (out of scope for contracts, report-only elsewhere)
const INLINE_EXCLUDE_GLOBS = [
  "!app/src/core/ui/catalog/**"
];

// Allowlist: CP can contain these hex values (keep tiny; prefer tokens)
const CP_HEX_ALLOWLIST = new Set([
  "#0b0d10"
]);

// Allowlist: create* exports not yet tracked in registry (phase-in)
const REGISTRY_COVERAGE_ALLOWLIST = new Set([
  // Phase-in escape hatch (keep empty; prefer fixing registry.ts)
]);

function rg(pattern, paths, extraArgs = "") {
  const quoted = pattern.replace(/"/g, '\\"');
  const list = paths.map(p => `"${p}"`).join(" ");
  const cmd = `rg -n "${quoted}" ${extraArgs} ${list}`;
  try {
    return sh(cmd);
  } catch (e) {
    // rg exits 1 when no matches; return empty
    return "";
  }
}

function listTsFiles(dir) {
  const out = sh(`find "${dir}" -type f \\( -name "*.ts" -o -name "*.tsx" \\) -print`);
  return out.split("\n").map(s => s.trim()).filter(Boolean);
}

function normalizePath(p) {
  return p.replace(/\\/g, "/");
}

function mdSection(title, body) {
  return `\n## ${title}\n\n${body}\n`;
}

const failures = [];
let report = `# UI Contracts Report\n\nGenerated: ${new Date().toISOString()}\n\n`;

/**
 * Contract A — No inline style.cssText drift in core ui/shared
 * - Gate already exists, but we enforce stricter: flag style.cssText in core ui except allowlist.
 */
{
  const globArgs = INLINE_EXCLUDE_GLOBS.map(g => `--glob "${g}"`).join(" ");
  const hits = rg(String.raw`style\.cssText\s*=|\.style\.cssText\s*=`, [UI_CORE_DIR, UI_SHARED_DIR], globArgs);
  const filtered = hits
    .split("\n")
    .filter(Boolean)
    .filter(line => {
      const file = line.split(":")[0];
      const norm = normalizePath(file);
      return !INLINE_ALLOWLIST.some(a => norm.endsWith(a));
    });

  report += mdSection(
    "Contract A — No inline cssText in core UI (except allowlist)",
    filtered.length
      ? `❌ Found disallowed inline cssText:\n\n\`\`\`\n${filtered.join("\n")}\n\`\`\`\nAllowlist: ${INLINE_ALLOWLIST.map(s => `\`${s}\``).join(", ") || "(none)"}`
      : `✅ OK (no disallowed inline cssText). Allowlist: ${INLINE_ALLOWLIST.map(s => `\`${s}\``).join(", ") || "(none)"}`
  );

  if (filtered.length) failures.push("Contract A failed: inline cssText found.");
}

/**
 * Contract B — CP must be flat: no gradients/images/urls in CP-scoped CSS
 * Enforce only within STYLE_ADMIN_FINAL.css (canonical).
 */
{
  if (!fileExists(CP_CSS)) {
    failures.push(`Contract B failed: missing ${CP_CSS}`);
    report += mdSection("Contract B — CP must be flat", `❌ Missing file: \`${CP_CSS}\``);
  } else {
    const hits = rg(String.raw`background-image|url\(|gradient\(`, [CP_CSS]);
    report += mdSection(
      "Contract B — CP must be flat (no background-image/url/gradient in canonical CSS)",
      hits.trim()
        ? `❌ Found disallowed tokens in \`${CP_CSS}\`:\n\n\`\`\`\n${hits.trim()}\n\`\`\``
        : `✅ OK (no background-image/url/gradient patterns found).`
    );
    if (hits.trim()) failures.push("Contract B failed: gradient/url/background-image found in canonical CSS.");
  }
}

/**
 * Contract C — No hex colors in CP scoped rules in STYLE_ADMIN_FINAL.css
 * Heuristic: scan CP CSS file and flag #RRGGBB / #RGB occurrences.
 * (We keep this strict; allowlist exists if truly required.)
 */
{
  if (fileExists(CP_CSS)) {
    const css = readFile(CP_CSS);
    const hexMatches = [];
    const hexRe = /#[0-9a-fA-F]{3,8}\b/g;

    // We only treat as "CP scoped" if line is within a [data-app-kind="control_plane"] block.
    // Simple heuristic: scan line-by-line and keep a "cpContext" toggle when line contains selector.
    const lines = css.split("\n");
    let cpContext = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('[data-app-kind="control_plane"]')) cpContext = true;
      // If line begins a non-cp selector at column 0 and contains [data-app-kind] but not control_plane, exit cp context
      if (/^\s*\[data-app-kind\][^{]*\{/.test(line) && !line.includes('control_plane')) cpContext = false;
      if (!cpContext) continue;

      if (line.trim().startsWith("--")) continue;

      const m = line.match(hexRe);
      if (m) {
        for (const h of m) {
          if (!CP_HEX_ALLOWLIST.has(h.toLowerCase())) {
            hexMatches.push(`${i + 1}: ${line.trim()}`);
            break;
          }
        }
      }
    }

    report += mdSection(
      "Contract C — No hex literals in CP-scoped CSS (STYLE_ADMIN_FINAL.css)",
      hexMatches.length
        ? `❌ Found hex literals inside CP-scoped rules:\n\n\`\`\`\n${hexMatches.slice(0, 200).join("\n")}\n\`\`\`\n(Showing up to 200 lines)`
        : `✅ OK (no hex literals found in CP-scoped rules).`
    );

    if (hexMatches.length) failures.push("Contract C failed: hex literals in CP-scoped CSS.");
  }
}

/**
 * Contract D — Component registry coverage: every createX() exported in app/src/core/ui/*.ts must be listed in registry.ts
 * Very pragmatic: find "export function create" occurrences, extract names, verify present in registry file content.
 */
{
  if (!fileExists(REGISTRY_TS)) {
    failures.push(`Contract D failed: missing ${REGISTRY_TS}`);
    report += mdSection("Contract D — Component registry coverage", `❌ Missing file: \`${REGISTRY_TS}\``);
  } else {
    const files = listTsFiles(UI_CORE_DIR).filter(f => !f.endsWith("registry.ts"));
    const reg = readFile(REGISTRY_TS);
    const missing = [];

    for (const f of files) {
      const rel = normalizePath(path.relative(ROOT, f));
      const content = readFile(f);
      const matches = [...content.matchAll(/export\s+function\s+(create[A-Za-z0-9_]+)\s*\(/g)].map(m => m[1]);
      for (const fn of matches) {
        if (REGISTRY_COVERAGE_ALLOWLIST.has(fn)) continue;
        // Coverage if either file path or function name appears in registry.ts (choose both to be safe).
        const ok = reg.includes(fn) || reg.includes(rel);
        if (!ok) missing.push(`${rel} -> ${fn}`);
      }
    }

    report += mdSection(
      "Contract D — Registry coverage (core/ui create* exports must be referenced)",
      missing.length
        ? `❌ Missing registry references:\n\n\`\`\`\n${missing.slice(0, 200).join("\n")}\n\`\`\`\n(Showing up to 200 items)`
        : `✅ OK (registry covers all create* exports in core/ui).`
    );

    if (missing.length) failures.push("Contract D failed: registry missing create* exports.");
  }
}

/**
 * Write report
 */
ensureDir(REPORTS_DIR);
writeFile(REPORT_PATH, report);

const summary = failures.length
  ? `FAIL (${failures.length} contracts)\n- ${failures.join("\n- ")}\nReport: ${REPORT_PATH}\n`
  : `PASS (all contracts)\nReport: ${REPORT_PATH}\n`;

process.stdout.write(summary);
process.exit(failures.length ? 1 : 0);
