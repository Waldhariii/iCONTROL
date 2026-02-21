#!/usr/bin/env bash
set -euo pipefail

echo "========================================"
echo "iCONTROL — CI gates:cp"
echo "ROOT=$(pwd)"
echo "TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "========================================"

pnpm -w install --frozen-lockfile
pnpm -w run gen:module-stubs
pnpm -w run gates:cp
