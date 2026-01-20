/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

// @placeholder owner:tbd expiry:2099-12-31 risk:low tag:WARN_PLACEHOLDER_NOT_IMPLEMENTED
const PROOF = "proofs/PROOFS_PLACEHOLDERS.json";
const OUT = "proofs/PROOFS_PLACEHOLDERS.md";

const proof = JSON.parse(fs.readFileSync(PROOF, "utf8"));
const items = (proof.items || []).map((x) => ({
  file: x.file,
  size: x.size_bytes || 0,
}));

function groupKey(f) {
  const parts = f.split("/");
  // Keep a business-friendly grouping level: app/src/core/<domain>/...
  const idx = parts.indexOf("core");
  if (idx >= 0 && parts.length > idx + 1) return `core/${parts[idx + 1]}`;
  // fallback: first 3 segments
  return parts.slice(0, 3).join("/");
}

const groups = new Map();
for (const it of items) {
  const k = groupKey(it.file);
  const arr = groups.get(k) || [];
  arr.push(it);
  groups.set(k, arr);
}

const sortedGroups = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);

const top = [...items].sort((a, b) => (b.size || 0) - (a.size || 0)).slice(0, 25);

const ts = new Date().toISOString();
let md = "";
md += `# PROOFS_PLACEHOLDERS — Backlog pilotable\n\n`;
md += `- kind: ICONTROL_PLACEHOLDER_INVENTORY_PROOF_V1\n`;
md += `- generated_at: ${ts}\n`;
md += `- count: ${items.length}\n\n`;

md += `## Répartition par domaine (grouping)\n\n`;
md += `| Domaine | # | Exemple |\n|---|---:|---|\n`;
for (const [k, arr] of sortedGroups) {
  const ex = (arr[0]?.file || "").slice(0, 120);
  md += `| ${k} | ${arr.length} | \`${ex}\` |\n`;
}

md += `\n## Top 25 (taille) — prioriser la stabilisation\n\n`;
md += `| # | Fichier | Taille (bytes) |\n|---:|---|---:|\n`;
top.forEach((it, i) => {
  md += `| ${i + 1} | \`${it.file}\` | ${it.size} |\n`;
});

md += `\n## Politique d’exécution\n\n`;
md += `- Tous les placeholders doivent contenir un header **@placeholder** avec owner/expiry/risk.\n`;
md += `- Remplacement par implémentation réelle avant toute mise en prod.\n`;
md += `- Tracking: ce fichier sert de backlog et d’input pour la roadmap.\n`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, md);
console.log("[OK] wrote " + OUT);
