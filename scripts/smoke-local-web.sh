#!/usr/bin/env bash
set -euo pipefail
HOST="${ICONTROL_LOCAL_HOST:-127.0.0.1}"
PORT="${ICONTROL_LOCAL_PORT:-4176}"
BASE="http://${HOST}:${PORT}"

check_code() {
  local url="$1"
  local expect="${2:-200}"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || true)
  if [ "$code" != "$expect" ]; then
    echo "FAIL $url (got $code expected $expect)"; exit 1
  fi
  echo "OK   $url"
}

check_json_field() {
  local url="$1"
  local key="$2"
  local expect="$3"
  local val
  val=$(curl -s "$url" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const j=JSON.parse(d);process.stdout.write(String(j['$key']??''))}catch(e){process.exit(2)}})" || true)
  if [ "$val" != "$expect" ]; then
    echo "FAIL $url ($key=$val expected $expect)"; exit 1
  fi
  echo "OK   $url ($key=$expect)"
}

# UI surfaces (should be served)
check_code "$BASE/app/#/login" 200
check_code "$BASE/cp/#/login" 200

# SSOT endpoints (must be 200 + stable payload)
check_code "$BASE/app/api/runtime-config" 200
check_code "$BASE/cp/api/runtime-config" 200
check_json_field "$BASE/app/api/runtime-config" "app_base_path" "/app"
check_json_field "$BASE/app/api/runtime-config" "cp_base_path" "/cp"
check_json_field "$BASE/cp/api/runtime-config" "app_base_path" "/app"
check_json_field "$BASE/cp/api/runtime-config" "cp_base_path" "/cp"

echo "SMOKE OK"
