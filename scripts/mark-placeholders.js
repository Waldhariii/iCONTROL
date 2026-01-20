/**
 // @placeholder owner:tbd expiry:2099-12-31 risk:low tag:WARN_PLACEHOLDER_NOT_IMPLEMENTED
 * Injecte un header standardise au-dessus des placeholders.
 * Objectif: observabilite + pilotage backlog sans casser CI.
 *
 * Header attendu (gouvernance):
 *   @placeholder owner:<...> expiry:<YYYY-MM-DD> risk:<low|med|high> tag:WARN_PLACEHOLDER_NOT_IMPLEMENTED
 *
 * Heuristique "placeholder":
 * - tag explicite "@placeholder" (si deja present -> skip)
 * - ou tokens: "placeholder" / "NOT_IMPLEMENTED" / "TODO: placeholder" / "fallback placeholder"
 */
const fs = require("fs");
const path = require("path");

const WT = process.cwd();
const ROOTS = [
  "app/src",
  "modules",
  "server",
  "scripts",
];

const EXCLUDE = new Set([
  "node_modules",
  "dist",
  ".git",
  "patches",
  "proofs",
]);

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

const HEADER = (owner = "tbd", expiry = "2099-12-31", risk = "low") =>
  `// @placeholder owner:${owner} expiry:${expiry} risk:${risk} tag:WARN_PLACEHOLDER_NOT_IMPLEMENTED`;

const files = [];
for (const r of ROOTS) walk(path.join(WT, r), files);

let patched = 0;
let skipped = 0;

for (const p of files) {
  let s = fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");
  const lines = s.split("\n");

  // si deja un header @placeholder dans le fichier, ne pas spammer
  if (lines.some(l => l.includes("@placeholder owner:") && l.includes("expiry:") && l.includes("risk:"))) {
    skipped++;
    continue;
  }

  // trouver un "site" placeholder (premiere occurrence) pour injecter 1 header au-dessus
  let idx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (looksLikePlaceholder(lines[i])) { idx = i; break; }
  }
  if (idx < 0) { skipped++; continue; }

  // injecter avant la ligne idx, en respectant indentation minimale
  const indent = (lines[idx].match(/^\s+/)?.[0] ?? "");
  const headerLine = indent + HEADER();

  // eviter double si une ancienne forme "@placeholder" existe
  if (lines.slice(Math.max(0, idx - 5), idx + 1).some(l => l.includes("@placeholder"))) {
    skipped++;
    continue;
  }

  lines.splice(idx, 0, headerLine);
  const next = lines.join("\n");
  if (next !== s) {
    fs.writeFileSync(p, next.endsWith("\n") ? next : (next + "\n"), "utf8");
    patched++;
  } else {
    skipped++;
  }
}

console.log(JSON.stringify({
  ok: true,
  kind: "ICONTROL_PLACEHOLDER_MARK_PROOF_V1",
  roots: ROOTS,
  patched,
  skipped,
  total_files_scanned: files.length,
}, null, 2));
