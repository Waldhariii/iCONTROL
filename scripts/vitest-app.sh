#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../app"
npx vitest run
