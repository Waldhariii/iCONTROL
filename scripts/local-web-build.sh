#!/usr/bin/env bash
# ============================================
# Local Web Build Script
# ============================================
# Builds APP and CP for local web server
# Ensures dist/app and dist/cp directories exist
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

# Create dist directories
mkdir -p dist/app dist/cp

# Build APP
echo "🔨 Building APP..."
VITE_APP_KIND=APP npm --prefix app run build -- --base /app/ --outDir "${ROOT}/dist/app"

# Build CP
echo "🔨 Building CP..."
VITE_APP_KIND=CONTROL_PLANE npm --prefix app run build -- --base /cp/ --outDir "${ROOT}/dist/cp"

echo "✅ Build complete"
