#!/usr/bin/env bash
set -euo pipefail

# ==================================================
# FIX VITE IMPORT: "@modules/core-billing" not resolved
# Scope: apps/control-plane (Vite + TS path mapping)
# Strategy: discover where "core-billing" lives, then wire alias/paths
# ==================================================

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")/../.." && pwd)"
APP="$ROOT/apps/control-plane"
VITE_CFG="$APP/vite.config.ts"
TS_CFG_APP="$APP/tsconfig.json"
TS_CFG_ROOT="$ROOT/tsconfig.json"
TS_CFG_BASE="$ROOT/tsconfig.base.json"
TS_CFG_PATHS="$ROOT/tsconfig.paths.json"

echo "ROOT=$ROOT"
echo "APP=$APP"
echo

echo "=== 0) Show failing import site ==="
nl -ba "$APP/src/main.ts" 2>/dev/null | sed -n '1,80p' || true
echo

echo "=== 1) Locate core-billing source (truth search) ==="
# Try to find any folder/file that looks like core-billing
CANDIDATES=()
while IFS= read -r p; do CANDIDATES+=("$p"); done < <(
  find "$ROOT" \
    -path "$ROOT/.git" -prune -o \
    -path "$ROOT/node_modules" -prune -o \
    -path "$ROOT/**/dist" -prune -o \
    -path "$ROOT/**/build" -prune -o \
    -path "$ROOT/**/.turbo" -prune -o \
    -path "$ROOT/**/.cache" -prune -o \
    \( -type d -name "core-billing" -o -type f -name "*core-billing*" \) -print 2>/dev/null
)

if [ "${#CANDIDATES[@]}" -eq 0 ]; then
  echo "ERR: aucune trace 'core-billing' trouvée dans le repo."
  echo "=> Soit le module n'existe pas sur ta branche actuelle, soit son nom a changé."
  echo
  echo "Quick next checks:"
  echo "  git status -sb"
  echo "  git branch --show-current"
  echo "  git log --oneline -n 5"
  echo
  echo "STOP."
  exit 2
fi

printf "FOUND_CANDIDATES=%s\n" "${#CANDIDATES[@]}"
printf '%s\n' "${CANDIDATES[@]}" | sed -n '1,80p'
echo

echo "=== 2) Locate BillingService symbol (to confirm the real entrypoint) ==="
grep -RIn --exclude-dir=node_modules --exclude-dir=.git \
  -E 'BillingService|BILLING_CONF|core-billing' \
  "$ROOT" 2>/dev/null | head -80 || true
echo

echo "=== 3) Choose best @modules root ==="
# Heuristic: prefer a top-level "modules" dir, otherwise any parent that contains core-billing
MODULES_ROOT=""
if [ -d "$ROOT/modules" ]; then
  MODULES_ROOT="$ROOT/modules"
else
  # pick parent dir of a "core-billing" directory if present
  for p in "${CANDIDATES[@]}"; do
    if [ -d "$p" ] && [ "$(basename "$p")" = "core-billing" ]; then
      MODULES_ROOT="$(cd "$(dirname "$p")" && pwd)"
      break
    fi
  done
fi

if [ -z "$MODULES_ROOT" ]; then
  echo "ERR: impossible de déterminer un répertoire racine pour @modules."
  echo "Candidates list above. Choisis le dossier parent des modules (ex: $ROOT/modules) et set:"
  echo "  MODULES_ROOT=/chemin/vers/modules"
  exit 3
fi

echo "MODULES_ROOT=$MODULES_ROOT"
if [ ! -d "$MODULES_ROOT/core-billing" ] && ! ls "$MODULES_ROOT" 2>/dev/null | grep -q "core-billing"; then
  echo "WARN: $MODULES_ROOT ne contient pas clairement core-billing."
  echo "On continue quand même: on va mapper @modules => $MODULES_ROOT"
fi
echo

echo "=== 4) Patch Vite alias (@modules -> MODULES_ROOT) ==="
if [ ! -f "$VITE_CFG" ]; then
  echo "ERR: vite.config.ts introuvable: $VITE_CFG"
  exit 4
fi

export ROOT APP VITE_CFG MODULES_ROOT
python3 - <<'PY'
import os, re, pathlib
root=os.environ["ROOT"]
vite_path=pathlib.Path(os.environ["VITE_CFG"])
modules_root=os.environ["MODULES_ROOT"]

s=vite_path.read_text(encoding="utf-8")

# Ensure resolve.alias exists and add @modules mapping
def ensure_alias_array(s: str) -> str:
    if re.search(r"resolve\s*:\s*\{", s) and re.search(r"\balias\s*:\s*\[", s):
        if "@modules" in s:
            return s
        rel = os.path.relpath(modules_root, os.path.dirname(vite_path))
        return re.sub(
            r"(alias\s*:\s*\[)",
            r"\1\n      { find: '@modules', replacement: require('path').resolve(__dirname, '%s') }," % rel.replace("\\", "/"),
            s,
            count=1
        )
    return ""

patched = ensure_alias_array(s)

if not patched:
    if re.search(r"resolve\s*:\s*\{", s) and re.search(r"\balias\s*:\s*\{", s):
        if "@modules" in s:
            patched=s
        else:
            rel = os.path.relpath(modules_root, os.path.dirname(vite_path)).replace("\\", "/")
            patched=re.sub(
                r"(alias\s*:\s*\{)",
                r"\1\n      '@modules': require('path').resolve(__dirname, '%s')," % rel,
                s,
                count=1
            )

if not patched:
    if "@modules" in s:
        patched=s
    else:
        m=re.search(r"defineConfig\s*\(\s*\{", s)
        if not m:
            raise SystemExit("ERR: cannot locate defineConfig({ in vite.config.ts for safe patch.")
        rel = os.path.relpath(modules_root, os.path.dirname(vite_path)).replace("\\", "/")
        ins = (
            "  resolve: {\n"
            "    alias: {\n"
            "      '@modules': require('path').resolve(__dirname, '%s'),\n" % rel
            "    },\n"
            "  },\n"
        )
        patched = s[:m.end()] + "\n" + ins + s[m.end():]

vite_path.write_text(patched, encoding="utf-8")
print(f"OK: patched {vite_path}")
PY

echo "OK: vite alias patched."
echo

echo "=== 5) Patch TS paths (@modules/* -> MODULES_ROOT/*) ==="
TARGET_TS=""
for f in "$TS_CFG_APP" "$TS_CFG_PATHS" "$TS_CFG_BASE" "$TS_CFG_ROOT"; do
  if [ -f "$f" ]; then TARGET_TS="$f"; break; fi
done

if [ -z "$TARGET_TS" ]; then
  echo "WARN: aucun tsconfig trouvé à patcher. On skip TS paths."
else
  echo "TARGET_TS=$TARGET_TS"
  export TARGET_TS MODULES_ROOT APP
  python3 - <<'PY'
import json, os, pathlib
ts_path=pathlib.Path(os.environ["TARGET_TS"])
modules_root=os.environ["MODULES_ROOT"]

data=json.loads(ts_path.read_text(encoding="utf-8"))

co=data.setdefault("compilerOptions", {})
paths=co.setdefault("paths", {})

base = ts_path.parent.resolve()
relpath = os.path.relpath(str(modules_root), str(base)).replace("\\", "/")

changed=False
want = [f"{relpath}/*"]
if paths.get("@modules/*") != want:
    paths["@modules/*"] = want
    changed=True

if "@modules" not in paths:
    paths["@modules"] = [relpath]
    changed=True

if changed:
    ts_path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    print(f"OK: patched TS paths in {ts_path}")
else:
    print(f"OK: TS paths already configured in {ts_path}")
PY
fi

echo
echo "=== 6) Sanity check: does module entry exist? ==="
ls -la "$MODULES_ROOT" 2>/dev/null | sed -n '1,120p' || true
echo
if [ -d "$MODULES_ROOT/core-billing" ]; then
  echo "core-billing dir:"
  find "$MODULES_ROOT/core-billing" -maxdepth 2 -type f 2>/dev/null | head -40 || true
fi
echo

echo "=== 7) Restart Vite (recommended) ==="
echo "Kill dev server if running, then:"
echo "  pnpm -C $APP dev"
echo
echo "If it still fails, paste:"
echo "  cat $VITE_CFG"
echo "  cat $TARGET_TS"
echo "  ls -la $MODULES_ROOT/core-billing || true"
