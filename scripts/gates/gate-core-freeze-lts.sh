#!/usr/bin/env bash
set -euo pipefail

# CORE FREEZE (LTS) gate
# - Bloque les changements "structurels" dans le Core (LTS) si aucun RFC APPROVED n’est mentionné.
# - Non destructif, audit-ready.
#
# Override:
#   CORE_FREEZE=0  -> désactive la gate (non recommandé)
#   CORE_FREEZE_STRICT=0 -> mode warning (par défaut strict=1)

CORE_FREEZE="${CORE_FREEZE:-1}"
STRICT="${CORE_FREEZE_STRICT:-1}"

if [ "${CORE_FREEZE}" != "1" ]; then
  echo "[gate][SKIP] CORE_FREEZE=0"
  exit 0
fi

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT" || exit 1

# Detect changed files (staged or unstaged) vs HEAD (CI) or vs merge-base
BASE="${GIT_BASE_REF:-HEAD}"
if git rev-parse --verify -q "origin/main" >/dev/null 2>&1; then
  # if on main, compare to HEAD^ when available; otherwise HEAD
  true
fi

# In CI, we usually compare against HEAD~1 is unreliable. Use HEAD for diff of working tree; if none, exit ok.
CHANGED="$(git diff --name-only --diff-filter=ACMRTUXB HEAD || true)"
if [ -z "$CHANGED" ]; then
  echo "[gate][OK] no changed files detected."
  exit 0
fi

is_core_path () {
  local p="$1"
  case "$p" in
    core/kernel/*|core/kernel/shared/*|runtime/configs/*|scripts/gates/*|scripts/release/*|governance/docs/*|governance/docs/ssot/*|governance/docs/architecture/*)
      return 0;;
    *)
      return 1;;
  esac
}

# Define what counts as "structural" in core: configs, boundaries, routes catalog, governance, release scripts,
# and any additions/removals/renames inside core-kernel/platform-services (API surface risk).
structural_hit=0
hits=()

while IFS= read -r f; do
  [ -z "$f" ] && continue
  if is_core_path "$f"; then
    structural_hit=1
    hits+=("$f")
  fi
done <<< "$CHANGED"

if [ "$structural_hit" -eq 0 ]; then
  echo "[gate][OK] no Core (LTS) paths changed."
  exit 0
fi

# RFC requirement: at least one RFC file with "Statut: APPROVED" modified or referenced in commit message.
# We allow either:
# 1) A modified RFC file containing "Statut: APPROVED"
# 2) A commit message containing "RFC-" and the RFC exists and is APPROVED
rfc_ok=0

# 1) changed RFC with APPROVED
RFC_CHANGED="$(echo "$CHANGED" | grep -E '^governance/docs/rfc/RFC-[0-9]{8}-[0-9]{3}-.*\.md$' || true)"
if [ -n "$RFC_CHANGED" ]; then
  while IFS= read -r r; do
    [ -z "$r" ] && continue
    if rg -n "Statut:\s*APPROVED" "$r" >/dev/null 2>&1; then
      rfc_ok=1
      break
    fi
  done <<< "$RFC_CHANGED"
fi

# 2) commit message references RFC-xxxx and file exists + APPROVED
if [ "$rfc_ok" -eq 0 ]; then
  msg="$(git log -1 --pretty=%B 2>/dev/null || true)"
  ref="$(echo "$msg" | rg -o 'RFC-[0-9]{8}-[0-9]{3}-[A-Za-z0-9_-]+' | head -n 1 || true)"
  if [ -n "$ref" ]; then
    file="$(ls "governance/docs/rfc/${ref}-"*.md 2>/dev/null | head -n 1 || true)"
    if [ -n "$file" ] && rg -n "Statut:\s*APPROVED" "$file" >/dev/null 2>&1; then
      rfc_ok=1
    fi
  fi
fi

echo "[gate][INFO] Core changed files:"
for h in "${hits[@]}"; do echo " - $h"; done

if [ "$rfc_ok" -eq 1 ]; then
  echo "[gate][OK] RFC APPROVED present (CORE LTS change allowed)."
  exit 0
fi

if [ "${STRICT}" = "1" ]; then
  echo "ERR_CORE_FREEZE_LTS: Core (LTS) changed without APPROVED RFC."
  echo "Action: create RFC in docs/rfc/ and mark Statut: APPROVED, or include RFC reference in commit message."
  exit 1
else
  echo "[gate][WARN] Core changed without APPROVED RFC (STRICT=0)."
  exit 0
fi
