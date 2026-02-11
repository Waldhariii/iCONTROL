#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"
p="${1:-}"
[[ -z "$p" ]] && exit 2
if [[ "$p" == /* ]]; then
  p="${p#"$ROOT/"}"
fi
git ls-files --error-unmatch "$p" >/dev/null 2>&1
