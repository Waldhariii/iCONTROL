#!/bin/zsh
set -euo pipefail

ROOT="$(cd "$(dirname "${0}")" && pwd)"
APP="$ROOT/app/src"

echo "=== ROUTES INSPECTION (no changes) ==="

show_file(){
  local f="$1"
  echo ""
  echo "------------------------------------------------------------"
  echo "FILE: $f"
  if [ ! -f "$f" ]; then
    echo "MISSING"
    return
  fi
  echo "SIZE: $(stat -f '%z' "$f") bytes | MTIME: $(stat -f '%Sm' -t '%Y-%m-%d %H:%M:%S' "$f")"
  echo ""
  echo "HEAD (first 120 lines):"
  nl -ba "$f" | sed -n '1,120p'
  echo ""
  echo "TAIL (last 120 lines):"
  local L
  L="$(wc -l < "$f" | tr -d ' ')"
  local start=$(( L>120 ? L-119 : 1 ))
  nl -ba "$f" | sed -n "${start},${L}p"
  echo ""
  echo "KEY LINES (router/routes/module/load/export/hash):"
  grep -nE 'route|routes|router|hashchange|location\.hash|navigate|render|moduleLoader|loadModule|export ' "$f" | head -200 || true
}

show_file "$APP/router.ts"
show_file "$APP/runtime/router.ts"
show_file "$APP/moduleLoader.ts"
show_file "$APP/main.ts"

echo ""
echo "=== NEXT: Paste me the KEY LINES section for app/src/router.ts (and runtime/router.ts if relevant) ==="
