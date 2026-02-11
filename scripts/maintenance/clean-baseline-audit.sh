#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# CANON CLEANUP / BASELINE PRUNE (SAFE BY DEFAULT)
# Root: /Users/danygaudreault/System_Innovex_CLEAN
#
# GOAL (per request):
#  - Keep ONLY base system + ONLY these pages for now:
#    Client APP: Dashboard, Settings, Account, Login
#    Admin/CP  : Dashboard, Login, Account, Settings
#  - Everything else: remove from runtime surface (quarantine first)
#  - Analyze EVERYTHING under root and propose minimal, clean structure
#  - Reduce root clutter (quarantine non-essential top-level folders)
#
# SAFETY:
#  - Default is DRY-RUN (NO deletions).
#  - Any destructive action requires:
#      DO_DELETE=1 ACK=I_UNDERSTAND_DESTRUCTIVE_DELETE
#  - Non-page content is quarantined, not deleted, unless you explicitly enable deletion.
# ============================================================

ROOT="/Users/danygaudreault/System_Innovex_CLEAN"
REPO="$ROOT/iCONTROL"
TS="$(date +%Y%m%d_%H%M%S)"
AUD="$REPO/_audit/CLEAN_BASELINE_$TS"
QB="$ROOT/_backups/quarantine_$TS"
QB_REPO="$REPO/_backups/quarantine_$TS"

DO_DELETE="${DO_DELETE:-0}"
ACK="${ACK:-}"

echo "=== CLEAN BASELINE (SAFE) ts=$TS ==="
echo "ROOT=$ROOT"
echo "REPO=$REPO"
echo "AUD=$AUD"
echo "QB=$QB"
echo "DO_DELETE=$DO_DELETE"
mkdir -p "$AUD" "$QB" "$QB_REPO"

test -d "$ROOT" || { echo "ERR: root not found: $ROOT"; exit 1; }
test -d "$REPO" || { echo "ERR: repo not found: $REPO"; exit 1; }

cd "$REPO"

# ------------------------------------------------------------
# 0) Repo sanity (must be clean before any structural edits)
# ------------------------------------------------------------
echo
echo "--- 0) repo status (must be clean) ---"
if [[ -n "$(git status --porcelain)" ]]; then
  echo "ERR: repo not clean. Commit/stash first."
  git status --short
  exit 1
fi
echo "OK: repo clean."

# ------------------------------------------------------------
# 1) Inventory EVERYTHING under ROOT (no delete)
# ------------------------------------------------------------
echo
echo "--- 1) inventory root tree (top-level) ---"
( cd "$ROOT" && ls -la ) | tee "$AUD/ROOT_LS.txt"

echo
echo "--- 1b) disk usage top-level (ROOT) ---"
( cd "$ROOT" && du -sh ./* 2>/dev/null | sort -hr ) | tee "$AUD/ROOT_DU.txt" || true

echo
echo "--- 1c) inventory repo tree hotspots ---"
du -sh ./* 2>/dev/null | sort -hr | tee "$AUD/REPO_DU.txt" || true

# ------------------------------------------------------------
# 2) Define allowed page set (high level intent)
# ------------------------------------------------------------
echo
echo "--- 2) allowed pages (intent) ---"
cat > "$AUD/ALLOWED_PAGES_INTENT.txt" <<'TXT'
CLIENT APP allowed pages (for now):
- Dashboard (client)
- Paramètres (client)
- Compte (client)
- Login (client)

ADMIN/CP allowed pages (for now):
- Dashboard (admin)
- Login (admin)
- Compte (admin)
- Paramètres (admin)

Rule:
- Anything else should be removed from runtime surface (quarantine first).
TXT
cat "$AUD/ALLOWED_PAGES_INTENT.txt"

# ------------------------------------------------------------
# 3) Locate routing / page registries (best-effort, no assumptions)
# ------------------------------------------------------------
echo
echo "--- 3) locate routing + page registries ---"
rg -n --hidden --glob '!**/node_modules/**' --glob '!**/dist/**' \
  -S -e 'route' -e 'routes' -e 'router' -e 'pagesInventory' -e 'pages-inventory' -e 'Page' \
  apps/control-plane/src 2>/dev/null | head -n 400 | tee "$AUD/ROUTING_HINTS_HEAD.txt" || true

# Candidate directories (adjust automatically if absent)
APP_PAGES_DIR="apps/control-plane/src/surfaces/app"
CP_PAGES_DIR="apps/control-plane/src/surfaces/cp"

echo
echo "--- 3b) list page dirs if present ---"
for d in "$APP_PAGES_DIR" "$CP_PAGES_DIR"; do
  if [[ -d "$d" ]]; then
    echo "DIR=$d"
    find "$d" -maxdepth 2 -type f \( -name "*.ts" -o -name "*.tsx" \) | sort | tee "$AUD/FILES_$(echo "$d" | tr '/:' '__').txt"
  else
    echo "INFO: missing dir: $d"
  fi
done

# ------------------------------------------------------------
# 4) Identify "extra" pages by name heuristics (safe, reviewable)
#    NOTE: Without your exact route SSOT catalog here, we do:
#      - Keep: dashboard*, login*, account/compte*, settings/param*
#      - Mark everything else under pages/app and pages/cp as EXTRA
# ------------------------------------------------------------
echo
echo "--- 4) mark extra pages (heuristic) ---"
KEEP_RE='(dashboard|login|account|compte|settings|param)'
EXTRA_LIST="$AUD/EXTRA_PAGES_CANDIDATES.txt"
: > "$EXTRA_LIST"

mark_extra_dir () {
  local dir="$1"
  [[ -d "$dir" ]] || return 0
  while IFS= read -r f; do
    bn="$(basename "$f" | tr '[:upper:]' '[:lower:]')"
    if [[ "$bn" =~ $KEEP_RE ]]; then
      echo "KEEP  $f" >> "$EXTRA_LIST"
    else
      echo "EXTRA $f" >> "$EXTRA_LIST"
    fi
  done < <(find "$dir" -type f \( -name "*.ts" -o -name "*.tsx" \) | sort)
}

mark_extra_dir "$APP_PAGES_DIR"
mark_extra_dir "$CP_PAGES_DIR"

sed -n '1,240p' "$EXTRA_LIST" | tee "$AUD/EXTRA_PAGES_CANDIDATES_HEAD.txt"
echo "OK: wrote $EXTRA_LIST"

# Also flag route catalog files (so we can later prune references)
rg -n --hidden --glob '!**/node_modules/**' --glob '!**/dist/**' \
  -S -e 'pagesInventory' -e 'client-pages-inventory' -e 'CP' -e 'CONTROL_PLANE' \
  apps/control-plane/src 2>/dev/null | tee "$AUD/INVENTORY_REFS.txt" || true

# ------------------------------------------------------------
# 5) Plan: quarantine "EXTRA" pages first (non-destructive by default)
# ------------------------------------------------------------
echo
echo "--- 5) quarantine plan (EXTRA pages) ---"
QPLAN="$AUD/QUARANTINE_PLAN_PAGES.txt"
: > "$QPLAN"
awk '/^EXTRA /{print $2}' "$EXTRA_LIST" > "$AUD/EXTRA_ONLY_FILES.txt" || true

count_extra="$(wc -l < "$AUD/EXTRA_ONLY_FILES.txt" | tr -d ' ')"
echo "EXTRA_COUNT=$count_extra" | tee -a "$QPLAN"
echo "DEST=$QB_REPO/pages_pruned_$TS" | tee -a "$QPLAN"
echo "Files:" >> "$QPLAN"
sed -n '1,400p' "$AUD/EXTRA_ONLY_FILES.txt" >> "$QPLAN"

echo "OK: wrote $QPLAN"

if [[ "$count_extra" -eq 0 ]]; then
  echo "INFO: no extra pages detected by heuristic (or dirs missing)."
fi

# ------------------------------------------------------------
# 6) Root minimization plan (quarantine top-level clutter)
#    - We DO NOT delete by default.
#    - We only consider common junk folders at ROOT level, not your code repos.
# ------------------------------------------------------------
echo
echo "--- 6) root minimization plan (SAFE) ---"
ROOT_PLAN="$AUD/ROOT_QUARANTINE_PLAN.txt"
: > "$ROOT_PLAN"

# whitelist keep at ROOT (conservative)
# You can later tighten this.
KEEP_ROOT_RE='^(iCONTROL|_backups|docs|README|LICENSE|\.gitignore|\.gitattributes|\.editorconfig)$'

( cd "$ROOT"
  for p in * .*; do
    [[ "$p" == "." || "$p" == ".." ]] && continue
    # ignore macOS noise
    [[ "$p" == ".DS_Store" ]] && continue

    # Decide keep/quarantine
    if [[ "$p" =~ $KEEP_ROOT_RE ]]; then
      echo "KEEP  $p" >> "$ROOT_PLAN"
    else
      echo "CAND  $p" >> "$ROOT_PLAN"
    fi
  done
)

sed -n '1,240p' "$ROOT_PLAN" | tee "$AUD/ROOT_QUARANTINE_PLAN_HEAD.txt"

# ------------------------------------------------------------
# 7) Apply changes (ONLY if explicitly authorized)
# ------------------------------------------------------------
apply_destructive () {
  [[ "$DO_DELETE" == "1" && "$ACK" == "I_UNDERSTAND_DESTRUCTIVE_DELETE" ]]
}

echo
echo "--- 7) APPLY (guarded) ---"
if apply_destructive; then
  echo "DESTRUCTIVE MODE ENABLED."

  echo
  echo "7a) quarantine EXTRA pages into repo backups..."
  mkdir -p "$QB_REPO/pages_pruned_$TS"
  while IFS= read -r f; do
    [[ -f "$f" ]] || continue
    dest="$QB_REPO/pages_pruned_$TS/$f"
    mkdir -p "$(dirname "$dest")"
    mv -f "$f" "$dest"
    echo "MOVED: $f -> $dest"
  done < "$AUD/EXTRA_ONLY_FILES.txt"

  echo
  echo "7b) root: quarantine top-level candidates (CAND) into $QB/root_pruned_$TS ..."
  mkdir -p "$QB/root_pruned_$TS"
  ( cd "$ROOT"
    awk '/^CAND  /{print $2}' "$ROOT_PLAN" | while IFS= read -r p; do
      [[ -e "$p" ]] || continue
      mv -f "$p" "$QB/root_pruned_$TS/$p"
      echo "MOVED_ROOT: $p -> $QB/root_pruned_$TS/$p"
    done
  )

else
  echo "SAFE MODE: no moves/deletions performed."
  echo "To execute quarantines, re-run with:"
  echo "  DO_DELETE=1 ACK=I_UNDERSTAND_DESTRUCTIVE_DELETE <this_script>"
fi

# ------------------------------------------------------------
# 8) Post-checks (if we moved pages): ensure build/tests/gates still pass
# ------------------------------------------------------------
echo
echo "--- 8) post-check (best-effort) ---"
if apply_destructive; then
  echo "Running gates (may fail until route catalog is updated):"
  npm run -s test || true
  npm run -s proofs:logs || true
  ( cd app && npm run -s verify:ssot:fast ) || true

  echo
  echo "STATUS:"
  git status --short || true

  echo
  echo "NEXT REQUIRED STEP:"
  echo "  Update your SSOT route/page inventory to remove references to quarantined pages."
  echo "  Then rerun gates until green, commit, and push."
else
  echo "Skipped gates (no changes applied)."
fi

echo
echo "--- 9) outputs ---"
echo "AUDIT DIR: $AUD"
echo "ROOT QUARANTINE DEST (if enabled): $QB/root_pruned_$TS"
echo "REPO PAGES QUARANTINE DEST (if enabled): $QB_REPO/pages_pruned_$TS"
echo "=== DONE ==="
