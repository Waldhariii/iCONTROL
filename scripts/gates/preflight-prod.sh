#!/usr/bin/env bash
set -euo pipefail

echo "[preflight:prod] start"
echo "[preflight:prod] node=$(node -v) npm=$(npm -v)"
echo "[preflight:prod] branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
echo "[preflight:prod] head=$(git rev-parse HEAD 2>/dev/null || true)"

# helpers
has_script() {
  node - <<'NODE' "$1"
const fs=require("fs");
const j=JSON.parse(fs.readFileSync("package.json","utf8"));
const k=process.argv[2];
process.exit(j.scripts && j.scripts[k] ? 0 : 1);
NODE
}
has_app_script() {
  node - <<'NODE' "$1"
const fs=require("fs");
const j=JSON.parse(fs.readFileSync("app/package.json","utf8"));
const k=process.argv[2];
process.exit(j.scripts && j.scripts[k] ? 0 : 1);
NODE
}
run_if_exists() {
  local s="$1"
  if has_script "$s"; then
    echo "[preflight:prod] run: $s"
    npm run -s "$s"
  else
    echo "[preflight:prod] skip: $s (script missing)"
  fi
}
has_eslint_config() {
  if [[ -f ".eslintrc" || -f ".eslintrc.js" || -f ".eslintrc.cjs" || -f ".eslintrc.json" || -f ".eslintrc.yml" || -f ".eslintrc.yaml" ]]; then
    return 0
  fi
  node - <<'NODE'
const fs=require("fs");
const j=JSON.parse(fs.readFileSync("package.json","utf8"));
process.exit(j.eslintConfig ? 0 : 1);
NODE
}

# --- REQUIRED: prod safety gates ---
# verify:prod:fast should already include the important governance gates (surfaces-only, no tenant sample data, etc.)
if has_script "verify:prod:fast"; then
  echo "[preflight:prod] run: verify:prod:fast (REQUIRED)"
  npm run -s verify:prod:fast
else
  echo "[preflight:prod][FAIL] missing script verify:prod:fast"
  exit 1
fi

# proofs:logs and SSOT fast are required in this repo
run_if_exists "proofs:logs"
if has_app_script "verify:ssot:fast"; then
  echo "[preflight:prod] run: verify:ssot:fast (REQUIRED)"
  (cd app && npm run -s verify:ssot:fast)
else
  echo "[preflight:prod][FAIL] missing script verify:ssot:fast"
  exit 1
fi

# --- REQUIRED: prod build ---
if has_script "build:prod"; then
  echo "[preflight:prod] run: build:prod (REQUIRED)"
  npm run -s build:prod
elif has_script "build"; then
  echo "[preflight:prod] run: build (fallback REQUIRED)"
  npm run -s build
else
  echo "[preflight:prod][FAIL] missing build:prod (and build fallback)"
  exit 1
fi

# --- OPTIONAL but recommended ---
run_if_exists "typecheck"
if has_script "lint"; then
  if has_eslint_config; then
    echo "[preflight:prod] run: lint"
    npm run -s lint
  else
    echo "[preflight:prod] skip: lint (no eslint config found)"
  fi
else
  echo "[preflight:prod] skip: lint (script missing)"
fi
run_if_exists "test"

echo "[preflight:prod] OK"
