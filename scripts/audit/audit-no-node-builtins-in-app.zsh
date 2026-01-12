#!/usr/bin/env zsh
set -euo pipefail

echo "=== AUDIT: no node:* builtins in app/src bundle surface ==="

SCOPE="app/src"
DENY=("node:fs" "node:path" "node:crypto" "node:os" "node:stream" "node:buffer")

FOUND=0
for p in "${DENY[@]}"; do
  if rg -n "$p" "$SCOPE" -S --glob "!**/__tests__/**" >/dev/null 2>&1; then
    echo "BLOCKED: found forbidden $p in $SCOPE (browser bundle risk)"
    rg -n "$p" "$SCOPE" -S --glob "!**/__tests__/**" || true
    FOUND=1
  fi
done

if [ "$FOUND" -eq 1 ]; then
  exit 1
fi

echo "OK: no node:* builtins referenced in app/src runtime"
