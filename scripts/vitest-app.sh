#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../app"
export VITE_APP_KIND=APP
npx vitest run
