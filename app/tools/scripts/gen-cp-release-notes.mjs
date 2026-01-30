import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const OUT_DIR = "dist/cp";
const DOC_DIR = path.join(OUT_DIR, "docs");

function sha256File(p) {
  const b = fs.readFileSync(p);
  return crypto.createHash("sha256").update(b).digest("hex");
}

function newest(globPrefix, globSuffix) {
  const all = fs.readdirSync(OUT_DIR).filter(n => n.startsWith(globPrefix) && n.endsWith(globSuffix)).sort();
  return all.length ? path.join(OUT_DIR, all[all.length - 1]) : null;
}

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const ver = pkg.version || "0.0.0";

const tarball = newest("CP_BUNDLE_", ".tgz");
const manifest = newest("CP_BUNDLE_MANIFEST_", ".json");
const shaFile = tarball ? `${tarball}.sha256` : null;

if (!tarball || !manifest || !shaFile || !fs.existsSync(shaFile)) {
  console.error("ERR: missing CP bundle artifacts. Need .tgz + .tgz.sha256 + manifest json in dist/cp.");
  process.exit(1);
}

const tarName = path.basename(tarball);
const mfName = path.basename(manifest);
const tarSha = fs.readFileSync(shaFile, "utf8").trim();
const mfJson = JSON.parse(fs.readFileSync(manifest, "utf8"));

if (mfJson.marker !== "ICONTROL_CP_BUNDLE_MANIFEST_V1") {
  console.error("ERR: manifest marker mismatch:", mfJson.marker);
  process.exit(1);
}

const artifacts = Array.isArray(mfJson.artifacts) ? mfJson.artifacts : [];
const lines = [];
lines.push(`# CP Release Notes`);
lines.push(``);
lines.push(`- **Package**: ${tarName}`);
lines.push(`- **Version**: ${ver}`);
lines.push(`- **Generated**: ${new Date().toISOString()}`);
lines.push(`- **Manifest**: ${mfName}`);
lines.push(`- **Checksum (tarball, sha256)**: \`${tarSha}\``);
lines.push(``);
lines.push(`## Scope`);
lines.push(`- CP bundle + compliance docs + manifest + checksums`);
lines.push(`- Objectif: livrable **audit-proof**, reproductible, vérifiable`);
lines.push(``);
lines.push(`## Key Controls (what's enforced)`);
lines.push(`- DEV-only routes: SSOT guard + docgen + drift verify`);
lines.push(`- CP compliance report: génération automatisée`);
lines.push(`- Bundle packaging: allowlist stricte + manifest + sha256`);
lines.push(`- Verify + extract drill: validation d’intégrité et d’arborescence`);
lines.push(``);
lines.push(`## How to verify (operator playbook)`);
lines.push(`1) \`npm run -s cp:bundle:verify\``);
lines.push(`2) \`npm run -s cp:bundle:extract\``);
lines.push(`3) \`npm run -s gate:cp\``);
lines.push(``);
lines.push(`## Manifest artifacts (SBOM light)`);
lines.push(`> Liste des artefacts attendus avec taille et sha256 (source: manifest).`);
lines.push(``);
lines.push(`| Path | Bytes | SHA256 |`);
lines.push(`|---|---:|---|`);
for (const a of artifacts) {
  const p = String(a?.path || "");
  const bytes = Number(a?.bytes || 0);
  const sha = String(a?.sha256 || "");
  lines.push(`| \`${p}\` | ${bytes} | \`${sha}\` |`);
}

lines.push(``);
lines.push(`## Limitations / non-goals`);
lines.push(`- SBOM "light": inventorie les **artefacts du bundle** (pas un inventaire complet dépendances NPM).`);
lines.push(`- Aucun upload automatique / aucune distribution externe: packaging local uniquement.`);
lines.push(``);

const relPath = path.join(DOC_DIR, "CP_RELEASE_NOTES.md");
fs.writeFileSync(relPath, lines.join("\n") + "\n");
console.log("Wrote:", relPath);

// Provenance doc (more formal)
const prov = [];
prov.push(`# CP Provenance`);
prov.push(``);
prov.push(`Marker: ICONTROL_CP_PROVENANCE_V1`);
prov.push(`Generated: ${new Date().toISOString()}`);
prov.push(`Version: ${ver}`);
prov.push(``);
prov.push(`## Inputs`);
prov.push(`- package.json (staged)`);
prov.push(`- docs/CP_COMPLIANCE_REPORT.md (staged)`);
prov.push(`- bundle/cp_src.tar.gz (staged)`);
prov.push(`- CP_BUNDLE_MANIFEST_*.json (staged)`);
prov.push(``);
prov.push(`## Outputs`);
prov.push(`- ${tarName}`);
prov.push(`- ${tarName}.sha256`);
prov.push(`- ${mfName}`);
prov.push(`- docs/CP_RELEASE_NOTES.md`);
prov.push(`- docs/CP_PROVENANCE.md`);
prov.push(``);
prov.push(`## Cryptographic integrity`);
prov.push(`- Tarball sha256: ${tarSha}`);
prov.push(`- Manifest sha256: ${sha256File(manifest)}`);
prov.push(``);
prov.push(`## Repro steps`);
prov.push(`- Build: npm run -s cp:bundle`);
prov.push(`- Verify: npm run -s cp:bundle:verify`);
prov.push(`- Extract: npm run -s cp:bundle:extract`);
prov.push(`- Governance: npm run -s gate:cp`);
prov.push(``);

const provPath = path.join(DOC_DIR, "CP_PROVENANCE.md");
fs.writeFileSync(provPath, prov.join("\n") + "\n");
console.log("Wrote:", provPath);
