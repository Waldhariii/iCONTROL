#!/usr/bin/env bash
set -euo pipefail

# ==================================================
# iCONTROL — Single-root Cleanroom (iCONTROL, pas iCONTROL)
# Objectif:
#  1) Supprimer les hardcodes /Users/danygaudreault/iCONTROL dans les scripts exécutables
#  2) Aligner la doc SSOT/ARCH principale (références root)
#  3) Laisser des preuves (rapport) + résumé de ce qui a été modifié
# ==================================================

ROOT="$(cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)" && pwd)"
OLD="${OLD:-/Users/danygaudreault/iCONTROL}"
NEW="${NEW:-$ROOT}"

REPORT_DIR="$ROOT/runtime/reports"
TS="$(date +"%Y%m%d_%H%M%S")"
REPORT="$REPORT_DIR/ROOT_CLEANROOM_${TS}.log"
mkdir -p "$REPORT_DIR"

echo "ROOT=$ROOT" | tee "$REPORT"
echo "OLD=$OLD" | tee -a "$REPORT"
echo "NEW=$NEW" | tee -a "$REPORT"
echo "REPORT=$REPORT" | tee -a "$REPORT"
echo "==================================================" | tee -a "$REPORT"

cd "$ROOT"

# 0) Inventaire avant
echo | tee -a "$REPORT"
echo "=== 0) INVENTAIRE AVANT (occurrences iCONTROL / hardcoded path) ===" | tee -a "$REPORT"
if command -v rg >/dev/null 2>&1; then
  RG="rg"
else
  RG="grep -RIn"
fi

# A) occurrences exactes du path hardcodé
echo "--- A) Path hardcodé exact ---" | tee -a "$REPORT"
$RG -n "$OLD" scripts governance/docs 2>/dev/null | head -200 | tee -a "$REPORT" || true

# B) occurrences du mot iCONTROL (branding/doc)
echo | tee -a "$REPORT"
echo "--- B) Mot-clé iCONTROL ---" | tee -a "$REPORT"
$RG -n "\biCONTROLapp\b" scripts governance/docs 2>/dev/null | head -200 | tee -a "$REPORT" || true

# 1) Patch scripts: remplacer le ROOT hardcodé par root dynamique (SCRIPT_DIR/../..)
echo | tee -a "$REPORT"
echo "=== 1) PATCH SCRIPTS (scripts/*) ===" | tee -a "$REPORT"

export ROOT OLD NEW
python3 - <<'PY'
import os, re, pathlib

root = pathlib.Path(os.environ["ROOT"]).resolve()
old = os.environ["OLD"]
new = os.environ["NEW"]

# Cibles: scripts (sh/zsh/mjs/ts/js)
targets = []
for pat in ("scripts/**/*.sh", "scripts/**/*.zsh", "scripts/**/*.mjs", "scripts/**/*.js", "scripts/**/*.ts"):
  targets += list(root.glob(pat))

changed = 0
for p in sorted(set(targets)):
  try:
    txt = p.read_text(encoding="utf-8")
  except Exception:
    continue

  orig = txt

  # (1) Remplacer hardcode exact du chemin
  if old in txt:
    txt = txt.replace(old, new)

  # (2) Standardiser les scripts qui ont ROOT="/Users/.../iCONTROL" -> ROOT déduit du script
  if re.search(r'(?m)^\s*ROOT\s*=\s*["\']?/Users/[^"\']+/(iCONTROL|iCONTROL)["\']?\s*$', txt):
    if "SCRIPT_DIR" not in txt:
      txt = re.sub(
        r'(?m)^\s*ROOT\s*=\s*["\']?/Users/[^"\']+/(iCONTROL|iCONTROL)["\']?\s*$',
        'SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"\nROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"',
        txt,
        count=1
      )

  if txt != orig:
    p.write_text(txt, encoding="utf-8")
    changed += 1

print(f"OK: scripts patched files={changed}")
PY | tee -a "$REPORT"

# 2) Patch docs SSOT/ARCH (aligner ROOT, mais sans réécrire tout l'historique)
echo | tee -a "$REPORT"
echo "=== 2) PATCH DOCS CANONIQUES (governance/docs) ===" | tee -a "$REPORT"

python3 - <<'PY'
import os, re, pathlib

root = pathlib.Path(os.environ["ROOT"]).resolve()
old = os.environ["OLD"]
new = os.environ["NEW"]

allow_paths = [
  "governance/docs/ssot",
  "governance/docs/architecture",
  "governance/docs/ARCH",
  "governance/docs/SECURITY",
  "governance/docs/adr",
]
targets = []
for ap in allow_paths:
  base = root / ap
  if base.exists():
    targets += list(base.rglob("*.md"))

changed = 0
for p in sorted(set(targets)):
  try:
    txt = p.read_text(encoding="utf-8")
  except Exception:
    continue

  orig = txt

  if old in txt:
    txt = txt.replace(old, new)

  txt = re.sub(r'(?m)^(#\s*)iCONTROL(\b.*)$', r'\1iCONTROL\2', txt)
  txt = re.sub(r'(?i)Single-root:\s*/Users/[^ \n]+/iCONTROL', f"Single-root: {new}", txt)

  if txt != orig:
    p.write_text(txt, encoding="utf-8")
    changed += 1

print(f"OK: docs patched files={changed}")
PY | tee -a "$REPORT"

# 3) Inventaire après + delta
echo | tee -a "$REPORT"
echo "=== 3) INVENTAIRE APRÈS ===" | tee -a "$REPORT"
echo "--- A) Path hardcodé exact (doit tendre vers 0 dans scripts + docs canoniques) ---" | tee -a "$REPORT"
$RG -n "$OLD" scripts governance/docs 2>/dev/null | head -200 | tee -a "$REPORT" || true

echo | tee -a "$REPORT"
echo "--- B) Mot-clé iCONTROL (ok si reste dans archives/packs, sinon à réduire) ---" | tee -a "$REPORT"
$RG -n "\biCONTROLapp\b" scripts governance/docs 2>/dev/null | head -200 | tee -a "$REPORT" || true

echo | tee -a "$REPORT"
echo "=== 4) CHANGED FILES (git diff names) ===" | tee -a "$REPORT"
git diff --name-only | tee -a "$REPORT" || true

echo | tee -a "$REPORT"
echo "=== 5) NEXT OPS ===" | tee -a "$REPORT"
echo "1) Ouvre le report: $REPORT" | tee -a "$REPORT"
echo "2) Si tout est ok: commit ces changements (cleanroom root)." | tee -a "$REPORT"
echo "3) Ensuite relance: pnpm -s icontrol:start (CP 5173 + API 7070)" | tee -a "$REPORT"

echo
echo "DONE. Report => $REPORT"
