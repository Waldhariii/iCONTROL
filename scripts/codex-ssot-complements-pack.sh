#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# CODEX — CATALOGS + SSOT COMPLETENESS (NON-DESTRUCTIVE)
# Objectif: produire les compléments manquants (Route Catalog, Capability Catalog,
# Tenant Matrix, Design System SSOT, règles page-modules) + checks "drift".
#
# IMPORTANT: aucun fichier de code applicatif n'est modifié. Tout sort dans _REPORTS.
# ==============================================================================

ROOT="${ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"
APP="${APP:-$ROOT/app}"
REPORTS="$ROOT/_REPORTS"
TS="$(date -u +"%Y%m%d_%H%M%S")"
OUT="$REPORTS/SSOT_COMPLEMENTS_PACK_${TS}"

mkdir -p "$OUT"/{inputs,extracted,deliverables,gates,logs,tmp}

log(){ printf "[%s] %s\n" "$(date +"%H:%M:%S")" "$*" | tee -a "$OUT/logs/00_run.log" ; }

log "ROOT=$ROOT"
log "APP=$APP"
log "OUT=$OUT"

export ROOT APP REPORTS OUT

# --- Sanity ---
command -v python3 >/dev/null || { echo "python3 requis"; exit 1; }
command -v rg >/dev/null || { echo "ripgrep (rg) requis"; exit 1; }

# ==============================================================================
# 1) EXTRACTION — ROUTES (heuristique robuste, multi-pattern)
#   - détecte des chaînes de routes typiques: "/xxx", "#/xxx", "path: '...'", "to='...'"
#   - normalise et déduplique
# ==============================================================================

log "Extract routes (heuristic) ..."
APP="$APP" python3 - <<'PY' >"$OUT/extracted/10_routes_detected.raw.txt"
import os, re, subprocess, sys
ROOT=os.environ.get("APP") or ""
if not ROOT:
    print("Missing APP env", file=sys.stderr); sys.exit(2)

# ripgrep patterns
patterns = [
    r'path\s*:\s*[\'"](/[^\'"]+)[\'"]',                 # router objects
    r'route\s*:\s*[\'"](/[^\'"]+)[\'"]',
    r'href\s*=\s*[\'"](/[^\'"]+)[\'"]',
    r'to\s*=\s*[\'"](/[^\'"]+)[\'"]',
    r'(?<![A-Za-z0-9_])["\'](/app/[^"\']+)["\']',       # /app/...
    r'(?<![A-Za-z0-9_])["\'](/cp/[^"\']+)["\']',        # /cp/...
    r'(?<![A-Za-z0-9_])["\'](/[^"\']{1,120})["\']',     # generic "/xxx"
    r'(?<![A-Za-z0-9_])["\'](#/[^"\']{1,120})["\']',    # hash routes
]

def rg(q):
    cmd=["rg","-n","--no-heading","--hidden","--glob","!.git/**","--glob","!node_modules/**", q, ROOT]
    p=subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True)
    return p.stdout.splitlines()

found=set()
for pat in patterns:
    # Use rg to prefilter by common tokens to keep it fast
    seed = "path" if "path" in pat else ("/" if "/[^" in pat else "#/")
    for line in rg(seed):
        # line format: file:line:content
        try:
            _,_,content=line.split(":",2)
        except ValueError:
            continue
        for m in re.finditer(pat, content):
            s=m.group(1).strip()
            found.add(s)

# normalize
norm=set()
for s in found:
    s=s.replace("\\","/").strip()
    s=re.sub(r'\s+','',s)
    s=re.sub(r'//+','/',s)
    # drop obviously invalid
    if len(s)<2: continue
    if s in ["/", "#/"]: continue
    # cut overly dynamic templates
    if "${" in s or "`" in s: continue
    # keep only plausible route-ish values
    if not (s.startswith("/") or s.startswith("#/")): continue
    norm.add(s)

for s in sorted(norm):
    print(s)
PY

# Split by surface (ADMIN/CLIENT/CP) with heuristics
log "Classify routes by surface heuristics ..."
OUT="$OUT" python3 - <<'PY' >"$OUT/extracted/11_routes_classified.json"
import json, os, re
raw_path=os.environ["OUT"]+"/extracted/10_routes_detected.raw.txt"
routes=[r.strip() for r in open(raw_path,"r",encoding="utf-8").read().splitlines() if r.strip()]

def surface(r):
    # Heuristics: /cp => CP ; /app => CLIENT ; else unknown => ADMIN/CLIENT TBD
    if r.startswith("/cp/") or r=="/cp": return "CP"
    if r.startswith("/app/") or r=="/app": return "CLIENT"
    if r.startswith("#/"): return "CLIENT"  # SPA hash assumed client
    # For admin: common patterns (adjustable)
    if any(x in r for x in ["/admin", "/console", "/control", "/settings", "/governance"]): return "ADMIN"
    return "UNKNOWN"

out=[]
for r in routes:
    out.append({
        "path": r,
        "surface": surface(r),
        "route_id": None,
        "page_module_id": None,
        "permissions_required": [],
        "feature_flag_id": None,
        "tenant_visibility": True,
        "status": "ACTIVE"
    })

print(json.dumps(out, indent=2, ensure_ascii=False))
PY

# ==============================================================================
# 2) EXTRACTION — PAGES / MODULES (page-centric, sans dépendances page↔page)
#   - inventaire des pages détectables par arborescence + conventions
# ==============================================================================

log "Inventory page candidates ..."
APP="$APP" python3 - <<'PY' >"$OUT/extracted/20_pages_inventory.json"
import os, json, re
APP=os.environ.get("APP","")
candidates=[]
roots=[
  os.path.join(APP,"src"),
  os.path.join(APP,"src","pages"),
  os.path.join(APP,"src","routes"),
  os.path.join(APP,"src","surfaces"),
]
seen=set()

def score(p):
    s=0
    name=os.path.basename(p).lower()
    if "page" in name: s+=2
    if name in ("index.tsx","index.ts","page.tsx","page.ts"): s+=2
    if p.endswith(".tsx"): s+=1
    if "/pages/" in p.replace("\\","/"): s+=2
    return s

for root in roots:
    if not os.path.isdir(root): 
        continue
    for dp,_,fns in os.walk(root):
        dpn=dp.replace("\\","/")
        if any(x in dpn for x in ["/node_modules/","/.git/","/dist/","/build/","/.cache/"]): 
            continue
        for fn in fns:
            if not (fn.endswith(".tsx") or fn.endswith(".ts")): 
                continue
            fp=os.path.join(dp,fn)
            fpn=fp.replace("\\","/")
            # heuristics for page-like files
            if any(k in fpn.lower() for k in ["/pages/","/route","/screen","/view","/surface"]):
                if fpn not in seen:
                    seen.add(fpn)
                    candidates.append({
                        "file": fpn,
                        "score": score(fpn),
                        "page_module_id": None,
                        "surface": "UNKNOWN",
                        "status": "ACTIVE"
                    })

candidates.sort(key=lambda x:(-x["score"], x["file"]))
print(json.dumps(candidates, indent=2, ensure_ascii=False))
PY

# ==============================================================================
# 3) LIVRABLES SSOT — ROUTE_CATALOG + PAGE_INVENTORY + FUNCTIONAL_CATALOG
#   - Génère des SSOT "ready-to-fill" + version lisible
# ==============================================================================

log "Generate SSOT deliverables skeletons ..."

OUT="$OUT" python3 - <<'PY'
import json, os, re, hashlib, datetime
OUT=os.environ["OUT"]
classified=json.load(open(OUT+"/extracted/11_routes_classified.json","r",encoding="utf-8"))
pages=json.load(open(OUT+"/extracted/20_pages_inventory.json","r",encoding="utf-8"))

# Deterministic route_id
def rid(path, surface):
    h=hashlib.sha1((surface+"|"+path).encode("utf-8")).hexdigest()[:10]
    # clean path for readability
    p=re.sub(r'[^a-zA-Z0-9]+','_',path).strip("_")[:32]
    return f"rt_{surface.lower()}_{p}_{h}"

for r in classified:
    r["route_id"]=rid(r["path"], r["surface"])
    if r["surface"]=="UNKNOWN":
        r["tenant_visibility"]=True
        r["status"]="EXPERIMENTAL"

route_catalog={
  "generated_utc": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
  "version": 1,
  "rules": {
    "must_declare_all_routes": True,
    "unknown_surface_allowed": True,
    "unknown_surface_deadline": "TBD",
    "no_serve_if_undeclared": "RECOMMENDED (enforcement gate to enable later)"
  },
  "routes": classified
}

open(OUT+"/deliverables/ROUTE_CATALOG.json","w",encoding="utf-8").write(json.dumps(route_catalog, indent=2, ensure_ascii=False))

# Page inventory markdown
lines=[]
lines.append("# PAGE_INVENTORY — inventaire technique (auto-généré)")
lines.append("")
lines.append(f"- generated_utc: {route_catalog['generated_utc']}")
lines.append(f"- source: scan arborescence + heuristiques")
lines.append("")
lines.append("## Top candidates (tri par score)")
lines.append("")
for p in pages[:120]:
    lines.append(f"- score={p['score']} | surface={p['surface']} | file={p['file']}")
open(OUT+"/deliverables/PAGE_INVENTORY.md","w",encoding="utf-8").write("\n".join(lines))

# Functional catalog skeleton
fn_lines=[]
fn_lines.append("# FUNCTIONAL_CATALOG — registre des capacités (SSOT à compléter)")
fn_lines.append("")
fn_lines.append(f"- generated_utc: {route_catalog['generated_utc']}")
fn_lines.append("")
fn_lines.append("## Format (1 entrée = 1 capability)")
fn_lines.append("```yaml")
fn_lines.append("- capability_id: cap_example_x")
fn_lines.append("  description: \"...\"")
fn_lines.append("  module_owner: \"module_x\"")
fn_lines.append("  surfaces: [ADMIN, CLIENT]")
fn_lines.append("  status: TODO   # DONE|PARTIAL|TODO|DISABLED")
fn_lines.append("  quality_level: PROTOTYPE  # PROTOTYPE|STABLE|HARDENED")
fn_lines.append("  dependencies: []")
fn_lines.append("  tenant_exposable: true")
fn_lines.append("```")
fn_lines.append("")
fn_lines.append("## Entrées à créer (minimum recommandé)")
fn_lines.append("- UI Admin (tables, formulaires, dashboard, configuration)")
fn_lines.append("- UI Client (dashboard, liste style Excel, actions, documents)")
fn_lines.append("- Docs/Files (scan/OCR, classement, VFS)")
fn_lines.append("- Jobs/Calendrier (J-01..J-08)")
fn_lines.append("- Finance (comparaisons, coûts, marges, pertes)")
fn_lines.append("- Governance (RBAC, SAFE_MODE, audit logs, feature flags)")
open(OUT+"/deliverables/FUNCTIONAL_CATALOG.md","w",encoding="utf-8").write("\n".join(fn_lines))

# Tenant matrix skeleton
tenant={
  "generated_utc": route_catalog['generated_utc'],
  "version": 1,
  "tenants": [
    {
      "tenant_id": "TEMPLATE_FREE",
      "plan": "FREE_CORE",
      "enabled_modules": [],
      "enabled_pages": [],
      "enabled_capabilities": [],
      "limits": {
        "storage_mb": 1024,
        "retention_days": 30
      },
      "billing_binding": "free",
      "audit_required": True
    },
    {
      "tenant_id": "TEMPLATE_PRO",
      "plan": "PRO",
      "enabled_modules": [],
      "enabled_pages": [],
      "enabled_capabilities": [],
      "limits": {
        "storage_mb": 10240,
        "retention_days": 365
      },
      "billing_binding": "paid",
      "audit_required": True
    }
  ]
}
open(OUT+"/deliverables/TENANT_FEATURE_MATRIX.json","w",encoding="utf-8").write(json.dumps(tenant, indent=2, ensure_ascii=False))

# Design system SSOT skeleton
ds=[]
ds.append("# DESIGN_SYSTEM_SSOT — Standard visuel Admin (anti-drift)")
ds.append("")
ds.append(f"- generated_utc: {route_catalog['generated_utc']}")
ds.append("")
ds.append("## 1) Tokens (SSOT)")
ds.append("- Couleurs (light/dark)")
ds.append("- Typographie (font-family, sizes, weights)")
ds.append("- Spacing (scale)")
ds.append("- Elevation (shadows)")
ds.append("")
ds.append("## 2) Composants officiels (registry)")
ds.append("- Table (style Excel: tri, filtres, pagination, colonnes, inline-edit)")
ds.append("- Form (validation, erreurs, readonly)")
ds.append("- Modal / Drawer")
ds.append("- Charts (journalier/hebdo/mensuel/trimestriel/annuel/custom)")
ds.append("- Notifications / Toast")
ds.append("")
ds.append("## 3) États standard")
ds.append("- Loading / Skeleton")
ds.append("- Empty states")
ds.append("- Error states")
ds.append("- Access denied")
ds.append("")
ds.append("## 4) Interdictions (hard rules)")
ds.append("- Styles inline non tokenisés")
ds.append("- Composants hors registry pour Admin")
ds.append("")
open(OUT+"/deliverables/DESIGN_SYSTEM_SSOT.md","w",encoding="utf-8").write("\n".join(ds))

# Page module rules
pm=[]
pm.append("# PAGE_MODULE_RULES — isolation par page/module (anti-bugs)")
pm.append("")
pm.append("Règles :")
pm.append("1) 1 page = 1 module propriétaire (page-module)")
pm.append("2) Interdiction de dépendance page→page")
pm.append("3) Communication uniquement via contracts/events")
pm.append("4) Lazy-load par défaut")
pm.append("5) Namespace de données strict par tenant")
pm.append("")
pm.append("Livrables attendus :")
pm.append("- page_module_id pour chaque route dans ROUTE_CATALOG.json")
pm.append("- mapping page_module_id -> dossiers/sources")
open(OUT+"/deliverables/PAGE_MODULE_RULES.md","w",encoding="utf-8").write("\n".join(pm))

PY

# ==============================================================================
# 4) GATES — DRIFT CHECKS (mode "observabilité" d'abord)
#   - route drift: compare routes détectées vs déclarées (ROUTE_CATALOG)
#   - sortie: PASS/WARN/FAIL (par défaut WARN non-bloquant)
# ==============================================================================

log "Create drift gates (non-blocking by default) ..."
cat >"$OUT/gates/run_route_drift_gate.sh" <<'GATESH'
#!/usr/bin/env bash
set -euo pipefail
OUT="${1:-.}"
CAT="$OUT/deliverables/ROUTE_CATALOG.json"
export OUT CAT

python3 - <<'PY'
import json, os, re, sys
OUT=os.environ.get("OUT",".")
CAT=os.environ.get("CAT","")
if not os.path.isfile(CAT):
    print("[FAIL] missing ROUTE_CATALOG.json at", CAT); sys.exit(2)

cat=json.load(open(CAT,"r",encoding="utf-8"))
decl=set()
for r in cat.get("routes",[]):
    decl.add(r.get("path","").strip())

# detected raw list lives in sibling extracted folder
det_path=os.path.join(os.path.dirname(os.path.dirname(CAT)),"extracted","10_routes_detected.raw.txt")
if not os.path.isfile(det_path):
    print("[WARN] missing detected routes file:", det_path)
    sys.exit(0)

det=set([x.strip() for x in open(det_path,"r",encoding="utf-8").read().splitlines() if x.strip()])

extra=sorted([x for x in det if x not in decl])
missing=sorted([x for x in decl if x not in det])

deliverables_dir=os.path.join(os.path.dirname(CAT))
os.makedirs(deliverables_dir, exist_ok=True)

open(os.path.join(deliverables_dir,"ROUTE_DRIFT_REPORT.md"),"w",encoding="utf-8").write(
    "# ROUTE_DRIFT_REPORT\n\n"
    f"- detected={len(det)}\n- declared={len(decl)}\n- extra_detected_not_declared={len(extra)}\n- declared_not_detected={len(missing)}\n\n"
    "## Extra (détecté mais non déclaré)\n" + "\n".join([f"- {x}" for x in extra[:400]]) + "\n\n"
    "## Missing (déclaré mais non détecté)\n" + "\n".join([f"- {x}" for x in missing[:400]]) + "\n"
)

if extra:
    print(f"[WARN] drift detected: extra={len(extra)} (non-bloquant par défaut)")
    sys.exit(0)
print("[PASS] no drift (detected subset of declared)")
PY
GATESH
chmod +x "$OUT/gates/run_route_drift_gate.sh"

# ==============================================================================
# 5) EXEC SUMMARY + INDEX
# ==============================================================================

log "Write EXEC summary + file index ..."
{
  echo "# EXEC SUMMARY — SSOT COMPLEMENTS PACK"
  echo
  echo "- generated_utc: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo "- out: $OUT"
  echo "- mode: non-destructive (reports only)"
  echo
  echo "## Deliverables (compléments manquants)"
  echo "- deliverables/ROUTE_CATALOG.json"
  echo "- deliverables/PAGE_INVENTORY.md"
  echo "- deliverables/FUNCTIONAL_CATALOG.md"
  echo "- deliverables/TENANT_FEATURE_MATRIX.json"
  echo "- deliverables/DESIGN_SYSTEM_SSOT.md"
  echo "- deliverables/PAGE_MODULE_RULES.md"
  echo "- deliverables/ROUTE_DRIFT_REPORT.md (après gate)"
  echo
  echo "## Extracted inputs"
  echo "- extracted/10_routes_detected.raw.txt"
  echo "- extracted/11_routes_classified.json"
  echo "- extracted/20_pages_inventory.json"
  echo
  echo "## Gates"
  echo "- gates/run_route_drift_gate.sh"
  echo
  echo "## Next steps (opérationnels, à exécuter dans l'ordre)"
  echo "1) Ouvrir ROUTE_CATALOG.json et remplir:"
  echo "   - route_id déjà généré"
  echo "   - page_module_id (obligatoire)"
  echo "   - permissions_required / feature_flag_id"
  echo "   - surface UNKNOWN -> ADMIN/CLIENT/CP"
  echo "2) Remplir FUNCTIONAL_CATALOG.md (capabilities) + statut (DONE/PARTIAL/TODO)"
  echo "3) Construire TENANT_FEATURE_MATRIX.json (plans + entitlements pages/capabilities)"
  echo "4) Verrouiller DESIGN_SYSTEM_SSOT.md (tokens + registry composants Admin)"
  echo "5) Exécuter le drift gate:"
  echo "   \$OUT/gates/run_route_drift_gate.sh \$OUT"
  echo
  echo "## Gouvernance recommandée"
  echo "- À terme: rendre ROUTE_DRIFT_REPORT bloquant en CI une fois le catalog stabilisé."
  echo "- Aucune nouvelle page/route sans update du catalog + audit (feature flags/tenant)."
} > "$OUT/99_EXEC_SUMMARY.md"

# Index
( cd "$OUT" && find . -type f | sed 's|^\./||' | sort ) > "$OUT/98_FILE_INDEX.md"

# Run gate once (non-bloquant)
"$OUT/gates/run_route_drift_gate.sh" "$OUT" >>"$OUT/logs/60_route_drift_gate.log" 2>&1 || true

log "[DONE] SSOT COMPLEMENTS PACK"
echo "=============================================="
echo "[DONE] OUT=$OUT"
echo "OPEN:"
echo "open \"$OUT\""
echo
echo "KEY FILES:"
echo " - $OUT/99_EXEC_SUMMARY.md"
echo " - $OUT/deliverables/ROUTE_CATALOG.json"
echo " - $OUT/deliverables/TENANT_FEATURE_MATRIX.json"
echo " - $OUT/deliverables/DESIGN_SYSTEM_SSOT.md"
echo " - $OUT/deliverables/ROUTE_DRIFT_REPORT.md"
echo "=============================================="
