/**
 * PLACEHOLDER GOVERNANCE
 * @placeholder
 * code: WARN_PLACEHOLDER_NOT_IMPLEMENTED
 * owner: core-platform
 * expiry: TBD
 * risk: LOW
 * file: scripts/inventory-placeholders.sh
 * created_at: 2026-01-20T01:13:27.385Z
 *
 * Rationale:
 * - Stub de compilation pour unblock bundling/tests.
 * - À remplacer par une implémentation réelle avant prod.
 */

#!/usr/bin/env bash
set -euo pipefail

ROOT="${1:-.}"
OUT_JSON="proofs/PROOFS_PLACEHOLDERS.json"
mkdir -p proofs

# Heuristic: placeholders are the recently created stub modules (core/*) and any file containing 'placeholder' marker
# We also treat files under app/src/core/** created in this branch as candidates.
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

# Collect candidates (tracked + untracked)
rg -n --hidden --glob '!**/node_modules/**' --files "$ROOT" \
  | rg -n '^(app/src/core/|app/src/pages/|modules/|server/|scripts/)' \
  > "$TMP" || true

# Extract placeholder hits (content-based)
PH="$(mktemp)"
trap 'rm -f "$PH"' EXIT

while IFS= read -r f; do
  if rg -n --hidden --glob '!**/node_modules/**' -S 'placeholder|TODO: placeholder|fallback placeholder|__PLACEHOLDER__' "$f" >/dev/null 2>&1; then
    echo "$f" >> "$PH"
  fi
done < "$TMP"

# Also include untracked TS/JS/TSX files created in core tree (likely stubs)
git status --porcelain | awk '/^\?\? /{print $2}' \
  | rg -n '^app/src/core/.*\.(ts|tsx|js)$' >> "$PH" || true

sort -u "$PH" -o "$PH"

# Build JSON proof
TS="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

node - <<'NODE'
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const listPath = process.env.PH_LIST || "/tmp/ph_list.txt";
const outPath = process.env.OUT_JSON || "proofs/PROOFS_PLACEHOLDERS.json";
const ts = process.env.TS || new Date().toISOString();

let files = [];
try {
  const raw = fs.readFileSync(listPath, "utf8").trim();
  files = raw ? raw.split("\n").filter(Boolean) : [];
} catch {}

function sha256(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

const items = files.map((f) => {
  let content = "";
  try { content = fs.readFileSync(f, "utf8"); } catch {}
  const firstLine = (content.split(/\r?\n/)[0] || "").slice(0, 200);
  const hasExportDefault = /\bexport\s+default\b/.test(content);
  const hasNamedExports = /\bexport\s+(const|function|class|type|interface)\b/.test(content);
  const placeholderHit = /placeholder|fallback placeholder|__PLACEHOLDER__/.test(content);

  return {
    file: f,
    rel: f,
    sha256: sha256(content),
    first_line: firstLine,
    has_export_default: hasExportDefault,
    has_named_exports: hasNamedExports,
    placeholder_hit: placeholderHit,
    size_bytes: Buffer.byteLength(content || "", "utf8"),
  };
});

const proof = {
  kind: "ICONTROL_PLACEHOLDER_INVENTORY_PROOF_V1",
  ts,
  count: items.length,
  items,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(proof, null, 2) + "\n");
console.log("[OK] wrote " + outPath + " (count=" + items.length + ")");
NODE
