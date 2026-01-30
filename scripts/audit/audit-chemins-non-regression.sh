#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
OUT_DIR="docs/audit/reports"
mkdir -p "$OUT_DIR"

REPORT="$OUT_DIR/AUDIT_NON_REGRESSION_CHEMINS.md"

FLAGS_JSON="app/src/policies/feature_flags.default.json"
ROUTER_ACTIVE="app/src/router.ts"
ROUTER_RUNTIME="app/src/runtime/router.ts"

fail(){ echo "FAIL: $*" >&2; exit 1; }
ok(){ echo "OK: $*"; }

echo "== Preflight =="
test -f "$FLAGS_JSON" || fail "Missing flags SSOT: $FLAGS_JSON"
test -f "$ROUTER_ACTIVE" || fail "Missing active router: $ROUTER_ACTIVE"

# ------------------------------------------------------------
# 1) Imports vers runtime/router.ts (parallèle) hors tests
# ------------------------------------------------------------
echo "== Scan: imports vers app/src/runtime/router.ts =="
rg -n --hidden --no-ignore-vcs \
  "from\s+['\"][^'\"]*runtime/router['\"]|runtime/router" \
  app/src modules platform-services server \
  > "$OUT_DIR/AUDIT_runtime_router_imports.txt" || true

# Filtrer: exclure tests, scripts shell, fichiers de documentation
if rg -n "runtime/router" "$OUT_DIR/AUDIT_runtime_router_imports.txt" | \
   rg -v "/tests?/|/__tests__/|\.test\.|\.spec\.|\.sh$|\.md$|\.txt$|cleanup|audit" >/dev/null; then
  echo "---- offenders ----"
  rg -n "runtime/router" "$OUT_DIR/AUDIT_runtime_router_imports.txt" | \
    rg -v "/tests?/|/__tests__/|\.test\.|\.spec\.|\.sh$|\.md$|\.txt$|cleanup|audit" | head -n 200 || true
  fail "Imports non-test vers runtime/router.ts détectés (routeur parallèle actif)."
else
  ok "Aucun import non-test vers runtime/router.ts"
fi

# ------------------------------------------------------------
# 2) Route-like files importés hors tests (autorité concurrente)
# ------------------------------------------------------------
echo "== Analyse: route-like importés hors tests (SSOT router.ts) =="
python3 - <<'PY'
import re, sys, pathlib, json

active = "app/src/router.ts"
deny = re.compile(r"/tests?/|/__tests__/|\.test\.|\.spec\.", re.I)

# Exclure les utilitaires légitimes du routeur principal (helpers, loaders, etc.)
legit_helpers = [
    "routeCatalogLoader",
    "routeCatalog",
    "navigate",
    "safeRender",
]

cand = []
for p in pathlib.Path("app/src").rglob("*.ts"):
    s = str(p).replace("\\","/")
    if s == active:
        continue
    name = p.name.lower()
    # Ignorer les helpers légitimes
    if any(helper.lower() in name for helper in legit_helpers):
        continue
    # Chercher uniquement les fichiers qui ressemblent à des routeurs alternatifs
    if ("router" in name and "loader" not in name and "catalog" not in name) or \
       (name == "routes.ts" or name == "routes.tsx"):
        cand.append(s)

def mod_id(path):
    return path.replace("app/src/","").replace(".ts","").replace(".tsx","")

imports = []
for f in pathlib.Path("app/src").rglob("*.ts"):
    sf = str(f).replace("\\","/")
    if deny.search(sf):
        continue
    # Ignorer si c'est le routeur principal qui importe
    if sf == active:
        continue
    try:
        txt = f.read_text(encoding="utf8", errors="ignore")
    except:
        continue
    for c in cand:
        mid = mod_id(c)
        # Vérifier si c'est un import réel (pas juste une mention dans un commentaire)
        if re.search(rf"import\s+.*from\s+['\"].*{re.escape(mid)}['\"]", txt):
            imports.append((c, sf))
            break

out = pathlib.Path("docs/audit/reports/AUDIT_route_like_imports.json")
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(imports, indent=2), encoding="utf8")

if imports:
    print("ERR_PARALLEL_ROUTE_LIKE_IMPORTS")
    for c,sf in imports[:50]:
        print(f"- candidate: {c} imported by {sf}")
    sys.exit(2)

print("OK_NO_PARALLEL_ROUTE_LIKE_IMPORTS")
PY

# ------------------------------------------------------------
# 3) Registries fantômes: CP_PAGES_REGISTRY / APP_PAGES_REGISTRY
# ------------------------------------------------------------
echo "== Scan: registries (definitions vs usages) =="
rg -n --hidden --no-ignore-vcs "CP_PAGES_REGISTRY" app/src > "$OUT_DIR/AUDIT_cp_pages_registry.txt" || true
rg -n --hidden --no-ignore-vcs "APP_PAGES_REGISTRY" app/src > "$OUT_DIR/AUDIT_app_pages_registry.txt" || true

python3 - <<'PY'
import json, re, sys, pathlib

deny = re.compile(r"/tests?/|/__tests__/|\.test\.|\.spec\.", re.I)

def analyze(report_path):
    p = pathlib.Path(report_path)
    if not p.exists():
        return []
    lines = p.read_text(encoding="utf8", errors="ignore").splitlines()
    files = []
    for l in lines:
        m = re.match(r"^([^:]+):(\d+):", l)
        if m: files.append(m.group(1))
    return sorted(set(files))

def has_external_usage(symbol, def_file):
    for f in pathlib.Path("app/src").rglob("*.ts"):
        sf = str(f).replace("\\","/")
        if deny.search(sf):
            continue
        if sf == def_file:
            continue
        txt = f.read_text(encoding="utf8", errors="ignore")
        if symbol in txt:
            return True, sf
    return False, None

cp_files = analyze("docs/audit/reports/AUDIT_cp_pages_registry.txt")
app_files = analyze("docs/audit/reports/AUDIT_app_pages_registry.txt")

problems = []

if len(cp_files) == 1:
    used, where = has_external_usage("CP_PAGES_REGISTRY", cp_files[0])
    if not used:
        problems.append(("CP_PAGES_REGISTRY_UNREFERENCED", cp_files[0]))

if len(app_files) == 1:
    used, where = has_external_usage("APP_PAGES_REGISTRY", app_files[0])
    if not used:
        problems.append(("APP_PAGES_REGISTRY_UNREFERENCED", app_files[0]))

if problems:
    print("ERR_GHOST_REGISTRIES_FOUND")
    for code, f in problems:
        print(f"- {code}: {f}")
    sys.exit(3)

print("OK_NO_GHOST_REGISTRIES")
PY

# ------------------------------------------------------------
# 4) Duplications fortes de routes (/cp /app) via strings
# ------------------------------------------------------------
echo "== Scan: duplication de routes (heuristique strings) =="
rg -n --hidden --no-ignore-vcs \
  "(path\s*:\s*['\"]/|route\s*:\s*['\"]/|['\"]/cp/|['\"]/app/)" \
  app/src \
  > "$OUT_DIR/AUDIT_route_strings.txt" || true

python3 - <<'PY'
import re, sys, pathlib, collections

p = pathlib.Path("docs/audit/reports/AUDIT_route_strings.txt")
if not p.exists():
    print("OK_NO_ROUTE_STRING_REPORT")
    sys.exit(0)

lines = p.read_text(encoding="utf8", errors="ignore").splitlines()
paths = []
for l in lines:
    m = re.findall(r"['\"](/(?:cp|app)/[^'\"]*)['\"]", l)
    for x in m:
        x = x.rstrip("/")
        # Ignorer les chemins de base (/cp, /app) et les URLs complètes avec hash (#/)
        if x in ["/cp", "/app"] or "#/" in x:
            continue
        # Ignorer les chemins API (/cp/api, /app/api)
        if "/api/" in x:
            continue
        paths.append(x)

c = collections.Counter(paths)
# Seuil plus élevé pour éviter faux positifs (routes communes comme /login sont normales)
dups = [(k,v) for k,v in c.items() if v >= 5]
dups.sort(key=lambda t: (-t[1], t[0]))

out = pathlib.Path("docs/audit/reports/AUDIT_route_duplicates.txt")
out.write_text("\n".join([f"{v}x {k}" for k,v in dups]) + ("\n" if dups else ""), encoding="utf8")

if dups:
    print("ERR_ROUTE_DUPLICATION_SUSPECT")
    for k,v in dups[:20]:
        print(f"- {k} : {v}x")
    sys.exit(4)

print("OK_NO_HIGH_CONF_DUP_ROUTE_STRINGS")
PY

# ------------------------------------------------------------
# 5) CLIENT_V2 SSOT detection: rapport (non-bloquant)
# ------------------------------------------------------------
echo "== Scan: CLIENT_V2 SSOT marker (CLIENT_V2_ROUTE_IDS) =="
rg -n --hidden --no-ignore-vcs "CLIENT_V2_ROUTE_IDS" app/src > "$OUT_DIR/AUDIT_client_v2_ssot.txt" || true

python3 - <<'PY'
import re, pathlib
p = pathlib.Path("docs/audit/reports/AUDIT_client_v2_ssot.txt")
if not p.exists():
    print("WARN_CLIENT_V2_SSOT_NOT_FOUND")
    raise SystemExit(0)

lines = p.read_text(encoding="utf8", errors="ignore").splitlines()
ssot_files = set()
for l in lines:
    # Detect CLIENT_V2_ROUTE_IDS definition (SSOT marker)
    if re.search(r"\bconst\s+CLIENT_V2_ROUTE_IDS\s*=", l):
        m = re.match(r"^([^:]+):\d+:", l)
        if m: ssot_files.add(m.group(1))

print("CLIENT_V2_DEF_FILES_COUNT=", len(ssot_files))
for f in sorted(ssot_files)[:50]:
    print("-", f)

# Verify that guards derive from SSOT (heuristic: check for .map() transformations)
if ssot_files:
    for f in ssot_files:
        try:
            content = pathlib.Path(f).read_text(encoding="utf8", errors="ignore")
            # Check that guards use CLIENT_V2_ROUTE_IDS.map() pattern
            if "CLIENT_V2_ROUTE_IDS.map" in content:
                print("OK_CLIENT_V2_GUARDS_DERIVE_FROM_SSOT:", f)
            else:
                print("WARN_CLIENT_V2_GUARDS_MISSING_MAP:", f)
        except:
            pass
PY

# ------------------------------------------------------------
# 6) Rapport consolidé + builds de preuve
# ------------------------------------------------------------
cat > "$REPORT" <<EOF
# AUDIT_NON_REGRESSION_CHEMINS

## Résultats
- Imports runtime/router.ts (hors tests): docs/audit/reports/AUDIT_runtime_router_imports.txt
- Route-like imports parallèles: docs/audit/reports/AUDIT_route_like_imports.json
- Registries: docs/audit/reports/AUDIT_cp_pages_registry.txt / docs/audit/reports/AUDIT_app_pages_registry.txt
- Duplications routes: docs/audit/reports/AUDIT_route_duplicates.txt
- CLIENT_V2 mentions: docs/audit/reports/AUDIT_client_v2_ssot.txt

## Verdict
Si ce script termine sans erreur: aucun routeur parallèle importé hors tests, aucun registry fantôme détecté, aucune duplication forte de routes détectée.
EOF

echo "== Proof builds =="
npm -s run -S build:cp
npm -s run -S build:app

ok "AUDIT COMPLETED: $REPORT"
