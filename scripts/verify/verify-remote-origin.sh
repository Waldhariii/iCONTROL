#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
if git remote | grep -qx "origin"; then
  echo "OK: origin=$(git config --get remote.origin.url || true)"
  exit 0
fi
echo "WARN: origin remote missing."
echo "Fix:"
echo "  export GIT_URL='git@github.com:<org>/<repo>.git'"
echo "  PUSH=1 ./scripts/maintenance/remote-rebind-and-push.sh"
exit 0
