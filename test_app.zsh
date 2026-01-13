#!/usr/bin/env zsh
set -euo pipefail

# Canonical shim (root entrypoint)
# Delegates to: scripts/dev/test_app.zsh

exec "${0:A:h}/scripts/dev/test_app.zsh" "$@"
