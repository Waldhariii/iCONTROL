#!/usr/bin/env bash
# ============================================
# Open Local SSOT URLs (Discovery-Based)
# ============================================
# Discovers routes from ROUTE_CATALOG.json via HTTP API
# Opens APP and CP with golden paths (home/dashboard)
# ============================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

HOST="${ICONTROL_LOCAL_HOST:-127.0.0.1}"
PORT_FILE="${ICONTROL_LOCAL_PORT_FILE:-/tmp/icontrol-local-web.port}"

# 1. Check if server is already running
PORT=""
if [ -f "$PORT_FILE" ]; then
  PORT="$(cat "$PORT_FILE" 2>/dev/null | tr -d ' \n\r\t' || true)"
  if [ -n "$PORT" ]; then
    # Verify server is actually responding
    if curl -s -f "http://${HOST}:${PORT}/app/api/runtime-config" >/dev/null 2>&1; then
      echo "✅ Server already running on port ${PORT}"
    else
      PORT=""
      rm -f "$PORT_FILE"
    fi
  fi
fi

# 2. Start server if not running
if [ -z "$PORT" ]; then
  echo "🚀 Starting local web server..."
  PORT="${ICONTROL_LOCAL_PORT:-4176}"
  echo "$PORT" > "$PORT_FILE"
  
  # Build first (ensure dist exists)
  echo "🔨 Building APP and CP..."
  BUILD_OUTPUT=$(npm run -s local:web:build 2>&1)
  BUILD_EXIT=$?
  if [ $BUILD_EXIT -ne 0 ]; then
    echo "⚠️  Build failed (exit code: $BUILD_EXIT)"
    echo "$BUILD_OUTPUT" | tail -5
  fi
  # Verify dist exists (ensure we're in ROOT directory)
  cd "$ROOT" || exit 1
  if [ ! -f "dist/app/index.html" ]; then
    echo "❌ Build incomplete: dist/app/index.html missing"
    echo "   Current dir: $(pwd)"
    echo "   Expected: $(pwd)/dist/app/index.html"
    echo "   Run manually: npm run local:web:build"
    exit 1
  fi
  if [ ! -f "dist/cp/index.html" ]; then
    echo "❌ Build incomplete: dist/cp/index.html missing"
    echo "   Current dir: $(pwd)"
    echo "   Expected: $(pwd)/dist/cp/index.html"
    echo "   Run manually: npm run local:web:build"
    exit 1
  fi
  echo "✅ Build complete: dist files verified"
  
  # Start server in background
  npm run -s local:web:serve >/dev/null 2>&1 &
  SERVER_PID=$!
  
  # Wait for server to be ready (max 30s)
  MAX_WAIT=30
  WAIT_COUNT=0
  while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    if curl -s -f "http://${HOST}:${PORT}/app/api/runtime-config" >/dev/null 2>&1; then
      echo "✅ Server ready on port ${PORT}"
      break
    fi
    sleep 1
    WAIT_COUNT=$((WAIT_COUNT + 1))
  done
  
  if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
    echo "❌ Server not responding after ${MAX_WAIT}s"
    echo "   Check logs or start manually: npm run local:web"
    kill "$SERVER_PID" 2>/dev/null || true
    exit 1
  fi
fi

# 3. Fetch route catalog via HTTP (SSOT)
CATALOG_URL="http://${HOST}:${PORT}/app/api/route-catalog"
CATALOG_JSON=$(curl -s -f "$CATALOG_URL" 2>/dev/null || echo "")

if [ -z "$CATALOG_JSON" ]; then
  echo "⚠️  Route catalog not available via API, using fallback routes"
  APP_ROUTE="#/home-app"
  CP_ROUTE="#/home-cp"
else
  # 4. Extract golden paths from catalog
  # Prefer: home > dashboard > first ACTIVE route
  APP_ROUTE=$(echo "$CATALOG_JSON" | node -e "
    const stdin = require('fs').readFileSync(0, 'utf8');
    const data = JSON.parse(stdin);
    const appRoutes = data.routes.filter(r => r.app_surface === 'CLIENT' && r.status === 'ACTIVE' && r.path);
    const home = appRoutes.find(r => r.route_id === 'home_app');
    const dashboard = appRoutes.find(r => r.route_id.includes('dashboard'));
    const first = appRoutes[0];
    const route = home || dashboard || first;
    console.log(route ? route.path : '#/home-app');
  " 2>/dev/null || echo "#/home-app")

  CP_ROUTE=$(echo "$CATALOG_JSON" | node -e "
    const stdin = require('fs').readFileSync(0, 'utf8');
    const data = JSON.parse(stdin);
    const cpRoutes = data.routes.filter(r => r.app_surface === 'CP' && r.status === 'ACTIVE' && r.path);
    const home = cpRoutes.find(r => r.route_id === 'home_cp');
    const dashboard = cpRoutes.find(r => r.route_id.includes('dashboard'));
    const first = cpRoutes[0];
    const route = home || dashboard || first;
    console.log(route ? route.path : '#/home-cp');
  " 2>/dev/null || echo "#/home-cp")
fi

# 5. Normalize routes (ensure # prefix for hash routing)
# Routes from catalog are already in format #/home-app
# URLs need: http://HOST:PORT/app/#/home-app
if [ "${APP_ROUTE:0:1}" != "#" ]; then
  APP_ROUTE="#${APP_ROUTE}"
fi
if [ "${APP_ROUTE:1:1}" != "/" ]; then
  APP_ROUTE="#/${APP_ROUTE#\#}"
fi

if [ "${CP_ROUTE:0:1}" != "#" ]; then
  CP_ROUTE="#${CP_ROUTE}"
fi
if [ "${CP_ROUTE:1:1}" != "/" ]; then
  CP_ROUTE="#/${CP_ROUTE#\#}"
fi

# 6. Build URLs (ensure / before hash for proper SPA routing)
# Format: http://HOST:PORT/app/#/home-app (not /app#/home-app)
CACHE_BUST="?t=$(date +%s)"
APP_URL="http://${HOST}:${PORT}/app/${APP_ROUTE}${CACHE_BUST}"
CP_URL="http://${HOST}:${PORT}/cp/${CP_ROUTE}${CACHE_BUST}"

# 7. Open URLs
echo "✅ Opening APP: ${APP_URL}"
echo "✅ Opening CP:  ${CP_URL}"

if command -v open >/dev/null 2>&1; then
  open "$APP_URL" >/dev/null 2>&1 || true
  sleep 0.5
  open "$CP_URL" >/dev/null 2>&1 || true
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$APP_URL" >/dev/null 2>&1 || true
  sleep 0.5
  xdg-open "$CP_URL" >/dev/null 2>&1 || true
else
  echo "⚠️  No 'open' or 'xdg-open' command found"
  echo "   APP: ${APP_URL}"
  echo "   CP:  ${CP_URL}"
fi
