#!/usr/bin/env zsh
set -euo pipefail
exec "$(cd "$(dirname "$0")" && pwd)/scripts/dev/test_app.zsh" "$@"
