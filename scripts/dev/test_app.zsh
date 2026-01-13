#!/usr/bin/env zsh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
APP="$ROOT/app"

echo "OK: test runner (terminal-only, non-destructive)"
echo "OK: ROOT=$ROOT"
echo "OK: APP=$APP"

cd "$APP"

# Prefer deterministic paths when available
if [[ -f pnpm-lock.yaml ]] && command -v pnpm >/dev/null 2>&1; then
  echo "OK: using pnpm"
  pnpm -v
  pnpm install --frozen-lockfile
  pnpm -s test
  exit 0
fi

# If workspace lock exists at repo root, use npm ci from root (deterministic)
if [[ -f "$ROOT/package-lock.json" ]]; then
  echo "OK: using npm ci (workspace lock at root)"
  cd "$ROOT"
  npm ci
  cd "$APP"
  npm test
  exit 0
fi

# No lockfile: allow install WITHOUT writing package-lock (keeps git clean)
echo "OK: no lockfile => npm install --no-package-lock (non-destructive)"
npm install --no-package-lock
npm test
