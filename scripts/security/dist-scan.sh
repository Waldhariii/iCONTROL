#!/usr/bin/env bash
set -euo pipefail

# Scan built artifacts for credential-like patterns (blocker gate).
# Scope: dist/ folders only (post-build).
PATTERNS=(
  'BOOTSTRAP_USERS'
  'password[:=]'
  'passwordHash'
  'api[_-]?key'
  'secret'
  'BEGIN PRIVATE KEY'
  'sk-[A-Za-z0-9]{10,}'
  'ghp_[A-Za-z0-9]{20,}'
  'AKIA[0-9A-Z]{16}'
)

FOUND=0
while IFS= read -r -d '' f; do
  for p in "${PATTERNS[@]}"; do
    if LC_ALL=C grep -RInE --binary-files=without-match --exclude-dir=node_modules --exclude-dir=.git "$p" "$f" >/dev/null 2>&1; then
      echo "[BLOCK] pattern='$p' file='$f'"
      # Print only context lines, not full file
      LC_ALL=C grep -nE "$p" "$f" | head -n 5 || true
      FOUND=1
    fi
  done
done < <(find . -type d -name dist -prune -print0)

if [ "$FOUND" -eq 1 ]; then
  echo
  echo "[FAIL] dist-scan detected credential-like strings in build outputs."
  echo "       Fix root cause (remove hardcoded creds / gate dev-only paths) then rebuild."
  exit 2
fi

echo "[OK] dist-scan passed."
