#!/usr/bin/env zsh
set -euo pipefail

APP_DIR="${APP_DIR:-app}"
cd "$APP_DIR"

RUNNER=""
if command -v pnpm >/dev/null 2>&1; then
  RUNNER="pnpm"
elif command -v corepack >/dev/null 2>&1; then
  corepack enable >/dev/null 2>&1 || true
  if command -v pnpm >/dev/null 2>&1; then
    RUNNER="pnpm"
  fi
fi

if [[ -z "$RUNNER" ]]; then
  RUNNER="npm"
fi

echo "OK: test runner=$RUNNER"

if [[ ! -d node_modules ]]; then
  if [[ "$RUNNER" == "pnpm" ]]; then
    if [[ -f pnpm-lock.yaml ]]; then
      pnpm install --frozen-lockfile
    else
      pnpm install
    fi
  else
    if [[ -f package-lock.json ]]; then
      npm ci
    else
      npm install --no-package-lock
    fi
  fi
fi

if [[ "$RUNNER" == "pnpm" ]]; then
  pnpm test
else
  npm test
fi
