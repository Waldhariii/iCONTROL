#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# POST-CLEAN BASELINE — after:
# DO_DELETE=1 ACK=I_UNDERSTAND_DESTRUCTIVE_DELETE bash scripts/maintenance/clean-baseline-audit.sh
#
# Objectif:
# 1) Voir ce qui a été déplacé (quarantaine) + ce qui reste
# 2) Identifier les références brisées (routes/inventaires/imports)
# 3) Réparer SSOT (ne garder que 4 pages APP + 4 pages CP)
# 4) Repasser toutes les gates jusqu'à PASS
# 5) Commit propre
# ============================================================

ROOT="${ROOT:-/Users/danygaudreault/System_Innovex_CLEAN}"
REPO="${REPO:-$ROOT/iCONTROL}"

cd "$REPO"

echo "=== POST-CLEAN BASELINE: INVENTORY + FIX ROUTING ==="
echo "REPO=$REPO"

echo
echo "--- 0) status git ---"
git status --short

echo
echo "--- 1) trouver le dernier audit CLEAN_BASELINE_* ---"
LATEST_AUD="$(ls -1dt "$REPO/_audit/CLEAN_BASELINE_"* 2>/dev/null | head -n 1 || true)"
if [[ -z "${LATEST_AUD:-}" ]]; then
  echo "ERR: aucun dossier _audit/CLEAN_BASELINE_* trouvé."
  exit 1
fi
echo "LATEST_AUD=$LATEST_AUD"

echo
echo "--- 2) afficher les outputs clés ---"
for f in \
  "ALLOWED_PAGES_INTENT.txt" \
  "EXTRA_PAGES_CANDIDATES_HEAD.txt" \
  "EXTRA_PAGES_CANDIDATES.txt" \
  "EXTRA_ONLY_FILES.txt" \
  "QUARANTINE_PLAN_PAGES.txt" \
  "ROOT_QUARANTINE_PLAN_HEAD.txt" \
  "ROOT_QUARANTINE_PLAN.txt" \
  "ROUTING_HINTS_HEAD.txt" \
  "INVENTORY_REFS.txt"
do
  if [[ -f "$LATEST_AUD/$f" ]]; then
    echo "=== $f ==="
    sed -n '1,220p' "$LATEST_AUD/$f"
    echo
  fi
done

echo
echo "--- 3) vérifier que les pages restantes correspondent au baseline ---"
APP_PAGES="app/src/surfaces/app"
CP_PAGES="app/src/surfaces/cp"

echo ">> APP pages (should contain only dashboard/login/account/settings variants)"
if [[ -d "$APP_PAGES" ]]; then
  find "$APP_PAGES" -type f \( -name "*.ts" -o -name "*.tsx" \) | sort
else
  echo "INFO: missing $APP_PAGES"
fi

echo
echo ">> CP pages (should contain only dashboard/login/account/settings variants)"
if [[ -d "$CP_PAGES" ]]; then
  find "$CP_PAGES" -type f \( -name "*.ts" -o -name "*.tsx" \) | sort
else
  echo "INFO: missing $CP_PAGES"
fi

echo
echo "--- 4) détecter les références brisées aux pages supprimées/déplacées ---"
mkdir -p "$REPO/_audit"
rg -n --hidden --glob '!**/node_modules/**' --glob '!**/dist/**' \
  -S -e 'src/pages/(app|cp)/' -e 'pagesInventory' -e 'client-pages-inventory' \
  app/src 2>/dev/null | tee "$LATEST_AUD/POST_REF_SCAN.txt" || true

echo
echo "--- 5) Lister imports vers fichiers inexistants (best-effort) ---"
export REPO
python3 - <<'PY'
from pathlib import Path
import re
import os

repo = Path(os.environ.get("REPO", "/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL"))
src = repo / "app" / "src"

# Collect existing ts/tsx modules (normalized)
existing = set()
for p in src.rglob("*"):
    if p.suffix in (".ts", ".tsx"):
        existing.add(str(p.resolve()))

# Naive import resolver for relative imports only
imp_re = re.compile(r'^\s*import\s+(?:type\s+)?[^;]*?\s+from\s+[\'"](.+?)[\'"]\s*;?\s*$', re.M)

missing = []
checked = 0

def resolve_rel(base: Path, target: str):
    # only relative imports
    if not target.startswith("."):
        return None
    cand = (base.parent / target).resolve()
    # try ts/tsx and index
    tries = [
        cand.with_suffix(".ts"),
        cand.with_suffix(".tsx"),
        cand / "index.ts",
        cand / "index.tsx",
    ]
    for t in tries:
        if t.exists():
            return str(t.resolve())
    return str(tries[0])

for f in src.rglob("*.ts*"):
    if not f.suffix in (".ts", ".tsx"):
        continue
    try:
        s = f.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        continue
    for m in imp_re.finditer(s):
        checked += 1
        path = m.group(1)
        resolved = resolve_rel(f, path)
        if resolved is None:
            continue
        if not Path(resolved).exists():
            missing.append((str(f), path, resolved))

print(f"checked_imports={checked}")
print(f"missing_rel_imports={len(missing)}")
for (ff, path, resolved) in missing[:120]:
    print(f"MISS: {ff} -> import '{path}' (expected {resolved})")

# Write full list for inspection
audit_dir = repo / "_audit"
audit_dir.mkdir(parents=True, exist_ok=True)
out = audit_dir / "POST_CLEAN_MISSING_IMPORTS.txt"
out.write_text("\n".join([f"{ff}\t{path}\t{resolved}" for (ff, path, resolved) in missing]), encoding="utf-8")
print(f"WROTE: {out}")
PY

echo
echo "--- 6) Réparer SSOT: forcer uniquement les routes baseline (manual edit required) ---"
echo "ACTION: ouvre ton fichier route-catalog / pagesInventory et supprime toute entrée qui n'est PAS:"
echo " - APP: dashboard, login, account/compte, settings/parametres"
echo " - CP : dashboard, login, account/compte, settings/parametres"
echo "Ensuite relance les gates ci-dessous."

echo
echo "--- 7) gates (doit revenir vert) ---"
set +e
npm run -s test
T1=$?
npm run -s proofs:logs
T2=$?
( cd app && npm run -s verify:ssot:fast )
T3=$?
set -e

echo
echo "RESULTS: test=$T1 proofs:logs=$T2 verify:ssot:fast=$T3"
if [[ "$T1" -ne 0 || "$T2" -ne 0 || "$T3" -ne 0 ]]; then
  echo
  echo "ERR: gates not green."
  echo "-> Regarde:"
  echo "   - $REPO/app/tools/ (verify:ssot:fast logs)"
  echo "   - $REPO/_audit/POST_CLEAN_MISSING_IMPORTS.txt"
  echo "   - $LATEST_AUD/POST_REF_SCAN.txt"
  echo "-> Corrige route catalog / imports cassés, puis rerun ce bloc."
  exit 1
fi

echo
echo "--- 8) commit propre (si changements) ---"
git status --short
if [[ -n "$(git status --porcelain)" ]]; then
  git add -A
  git commit -m "chore(baseline): prune to 8 core pages + clean root structure" || true
fi

echo
echo "--- 9) status final ---"
git status --short
echo "=== DONE ==="
