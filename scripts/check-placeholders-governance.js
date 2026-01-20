/**
 // @placeholder owner:tbd expiry:2099-12-31 risk:low tag:WARN_PLACEHOLDER_NOT_IMPLEMENTED
 * Gouvernance placeholders:
 * - detecte les placeholders (heuristique)
 * - exige un header standardise dans une fenetre locale
 * - produit proofs/PROOFS_PLACEHOLDERS_GOVERNANCE.json
 * Non-bloquant: WARN_ONLY par design (pilotage backlog).
 */
const fs = require("fs");
const path = require("path");

const WT = process.cwd();
const OUT = path.join(WT, "proofs", "PROOFS_PLACEHOLDERS_GOVERNANCE.json");

const EXCLUDE = new Set(["node_modules", "dist", ".git", "patches", "proofs"]);
const EXT_OK = new Set([".ts", ".tsx", ".js", ".jsx"]);

function walk(dir, out) {
  if (!fs.existsSync(dir)) return;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const it of items) {
    const p = path.join(dir, it.name);
    if (it.isDirectory()) {
      if (EXCLUDE.has(it.name)) continue;
      walk(p, out);
    } else if (it.isFile()) {
      const ext = path.extname(it.name);
      if (!EXT_OK.has(ext)) continue;
      out.push(p);
    }
  }
}

function looksLikePlaceholder(line) {
  const s = line.toLowerCase();
  return (
    s.includes("placeholder") ||
    s.includes("not_implemented") ||
    s.includes("not implemented") ||
    s.includes("fallback placeholder") ||
    s.includes("todo: placeholder")
  );
}

// header SSOT: @placeholder owner:.. expiry:.. risk:.. tag:WARN_PLACEHOLDER_NOT_IMPLEMENTED
function isGovernanceHeader(line) {
  return (
    line.includes("@placeholder") &&
    line.includes("owner:") &&
    line.includes("expiry:") &&
    line.includes("risk:") &&
    line.includes("WARN_PLACEHOLDER_NOT_IMPLEMENTED")
  );
}

const roots = ["app/src", "modules", "server", "scripts"];
const files = [];
for (const r of roots) walk(path.join(WT, r), files);

let totalPlaceholders = 0;
const missing = [];

for (const p of files) {
  const rel = path.relative(WT, p);
  const s = fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");
  const lines = s.split("\n");

  for (let i = 0; i < lines.length; i++) {
    if (!looksLikePlaceholder(lines[i])) continue;

    totalPlaceholders++;

    // fenetre: 30 lignes au-dessus
    const start = Math.max(0, i - 30);
    const window = lines.slice(start, i + 1);
    const ok = window.some(isGovernanceHeader);

    if (!ok) {
      missing.push({ file: rel, line: i + 1, sample: lines[i].trim().slice(0, 140) });
    }

    // limiter bruit: 1 hit par fichier suffit pour gouvernance (sinon explosion)
    break;
  }
}

const proof = {
  kind: "ICONTROL_PLACEHOLDERS_GOVERNANCE_PROOF_V1",
  rule: "Any file containing placeholders must carry SSOT header: @placeholder owner:<..> expiry:<..> risk:<..> tag:WARN_PLACEHOLDER_NOT_IMPLEMENTED",
  roots,
  total_files_scanned: files.length,
  total_files_with_placeholder: (totalPlaceholders ? (missing.length ? (new Set(missing.map(m => m.file))).size : null) : 0),
  total_placeholder_hits: totalPlaceholders,
  missing_header_count: missing.length,
  missing: missing.slice(0, 200),
  note: "WARN_ONLY by design: produces proof for backlog governance without blocking CI.",
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(proof, null, 2) + "\n");

if (missing.length === 0) {
  console.log("[OK] placeholders governance: all governed (proof written)");
} else {
  console.log(`[WARN] placeholders governance: missing_header_count=${missing.length} (proof written)`);
  process.exit(0);
}
