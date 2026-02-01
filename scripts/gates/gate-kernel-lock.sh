#!/usr/bin/env bash
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"

echo "[gate] kernel-lock"

for forbidden in \
  "app/src/domain" \
  "app/src/entities" \
  "app/src/usecases" \
  "app/src/repositories" \
  "app/src/services/business" \
  "app/src/aggregates"
do
  if [ -d "$ROOT/$forbidden" ]; then
    echo "ERR_KERNEL_BUSINESS_IN_APP: forbidden folder exists: $forbidden"
    exit 1
  fi
done

ALLOW_RE='app/src/(platform|core|dev|__tests__)/'
hits="$(rg -n -e '\blocalStorage\.|sessionStorage\.' "$ROOT/app/src" --glob '!**/node_modules/**' 2>/dev/null || true)"
offenders="$(echo "$hits" | awk -F: -v allow="$ALLOW_RE" 'NF>1{file=$1; if (file !~ allow) print $0;}' || true)"
if [[ -n "${offenders:-}" ]]; then
  echo "ERR_KERNEL_STORAGE_DIRECT: storage usage outside allowed paths (platform/core/dev/__tests__)"
  echo "$offenders"
  exit 1
fi

# Exclude .node.ts files (Node-only, allowed to use fs)
fs_hits="$(rg -n "from ['\"]fs['\"]|require\(['\"]fs['\"]\)" "$ROOT/app/src" --glob '!**/*.node.ts' 2>/dev/null || true)"
if [[ -n "$fs_hits" ]]; then
  echo "ERR_KERNEL_NODE_FS: fs import detected in app/src (browser bundle)"
  echo "$fs_hits"
  exit 1
fi

if rg -n "from ['\"].*app/src" "$ROOT/modules" >/dev/null 2>&1; then
  echo "ERR_KERNEL_IMPORT_BOUNDARY: modules importing app/src"
  exit 1
fi

echo "[gate] kernel-lock PASS"
