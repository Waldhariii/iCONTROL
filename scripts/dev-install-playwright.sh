#!/usr/bin/env bash
set -euo pipefail
echo "[INFO] Dev-only install. This will add Playwright as a devDependency."
echo "[INFO] If you don't want any dependency, cancel now."
npm i -D playwright
echo "[OK] playwright installed (dev-only). You may now re-run scripts/prove-window-runtimeconfig.sh for real browser proof."
