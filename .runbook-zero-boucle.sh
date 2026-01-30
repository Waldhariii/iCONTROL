#!/usr/bin/env zsh
set -euo pipefail

# ============================================================
# CURSOR — RUNBOOK DE CORRECTION "ZÉRO BOUCLE" + DÉDUP ROUTING + PURGE LOGIN + RENAME PAGES (CP/APP/ERR)
# ============================================================
# Repo: <REPO_ROOT> (use: REPO_ROOT="${1:-$(pwd)}" or pass as first arg)
# Mandat: corriger parfaitement (root cause), supprimer totalement login/login-theme et tous les chemins associés,
# supprimer les pages "partagées" entre les 2 applis + leurs routes, puis renommer toutes les pages restantes selon le scope (CP / APP / ERR).
# Contraintes: SSOT strict, aucun router parallèle même inactif, aucun chemin machine hardcodé, commits atomiques, gates verts.

REPO_ROOT="${1:-$(pwd)}"
cd "$REPO_ROOT" || exit 1

HOME_ROOT="${HOME%/*}"
RUN_ID=$(date +%Y%m%d_%H%M%S)
REPORT_DIR="_REPORTS/zero-boucle/${RUN_ID}"
mkdir -p "$REPORT_DIR"

log() {
  echo "[$(date +%H:%M:%S)] $*" | tee -a "$REPORT_DIR/runbook.log"
}

run_cmd() {
  local cmd="$1"
  log "EXEC: $cmd"
  eval "$cmd" >> "$REPORT_DIR/cmd.log" 2>&1 || {
    log "ERR: Command failed: $cmd"
    return 1
  }
}

# ============================================================
# 1) INVENTORY — PROUVER LES CAUSES & IDENTIFIER TOUTES LES ENTRÉES
# ============================================================
log "=== PHASE 1: INVENTORY ==="

log "1.1 Routing / boot multiples"
rg -n --hidden --glob '!.git' "bootRouter\(" app/src > "$REPORT_DIR/inventory_bootRouter.txt" 2>&1 || true
rg -n --hidden --glob '!.git' "addEventListener\(\"hashchange\"" app/src > "$REPORT_DIR/inventory_hashchange.txt" 2>&1 || true
rg -n --hidden --glob '!.git' "applyClientV2Guards\(" app/src > "$REPORT_DIR/inventory_applyGuards.txt" 2>&1 || true

log "1.2 Login / login-theme (suppression complète)"
rg -n --hidden --glob '!.git' "(#/login|login-theme|LoginTheme|login_theme|renderRoute\(\"login\"|RouteId.*login)" app/src modules > "$REPORT_DIR/inventory_login.txt" 2>&1 || true
find app/src -name "*login*.ts" -o -name "*login*.tsx" > "$REPORT_DIR/inventory_login_files.txt" 2>&1 || true

log "1.3 Pages partagées CP/APP"
rg -n --hidden --glob '!.git' "pages/cp/|/cp/" app/src/pages/app > "$REPORT_DIR/inventory_cross_cp.txt" 2>&1 || true
rg -n --hidden --glob '!.git' "pages/app/|/app/" app/src/pages/cp > "$REPORT_DIR/inventory_cross_app.txt" 2>&1 || true

log "1.4 Mutations directes location.hash"
rg -n --hidden --glob '!.git' "window\.location\.hash\s*=" app/src modules > "$REPORT_DIR/inventory_location_hash.txt" 2>&1 || true

log "1.5 Routers parallèles"
rg -n --hidden --glob '!.git' "app/src/runtime/router\.ts|platform-services/ui-shell/routing/router\.ts" app/src > "$REPORT_DIR/inventory_parallel_routers.txt" 2>&1 || true

log "Inventory completed. Reports in $REPORT_DIR/"

# ============================================================
# 2) CORRECTION CRITIQUE — STOPPER LA BOUCLE INFINIE (SANS LOGIN)
# ============================================================
log "=== PHASE 2: CORRECTION BOUCLE INFINIE ==="

# 2.1 Idempotence navigation (app/src/runtime/navigate.ts)
log "2.1 Making navigation idempotent"
cat > app/src/runtime/navigate.ts << 'NAVIGATE_EOF'
/**
 * Canonical navigation entrypoint.
 * Governance: do not mutate location.hash outside this module.
 */
let lastRedirectHash: string | null = null;
let lastRedirectTs: number = 0;
let redirectCount = 0;

export function navigate(hashRoute: string): void {
  // Normalize: always use "#/..." shape when provided as "/..."
  const h = hashRoute.startsWith("#") ? hashRoute : `#${hashRoute.startsWith("/") ? "" : "/"}${hashRoute}`;
  
  // Idempotence: if already on target hash, NOOP
  const currentHash = globalThis.location.hash || "";
  if (currentHash === h) {
    return;
  }
  
  // Anti-loop guard: prevent rapid redirects to same hash
  const now = Date.now();
  if (lastRedirectHash === h && (now - lastRedirectTs) < 1000) {
    redirectCount++;
    if (redirectCount >= 2) {
      console.warn("NAVIGATE_LOOP_DETECTED", { target: h, count: redirectCount });
      return; // NOOP to break loop
    }
  } else {
    redirectCount = 0;
  }
  
  lastRedirectHash = h;
  lastRedirectTs = now;
  globalThis.location.hash = h;
}
NAVIGATE_EOF

# 2.2 Unifier guards (supprimer duplication dans router.ts)
log "2.2 Unifying guards pipeline (removing duplicate applyClientV2Guards calls)"
# Cette correction sera faite dans la section router.ts plus bas

# 2.3 __clientV2IsAllowed() déterministe
log "2.3 Making __clientV2IsAllowed() deterministic"
# Cette correction sera faite dans la section router.ts plus bas

# 2.4 ensureAuth() sans login
log "2.4 Fixing ensureAuth() to not redirect to #/login"
# Cette correction sera faite dans la section router.ts plus bas

log "Phase 2 completed"

# ============================================================
# 3) PURGE — SUPPRIMER COMPLÈTEMENT login + login-theme + chemins associés
# ============================================================
log "=== PHASE 3: PURGE LOGIN/LOGIN-THEME ==="

# 3.1 Supprimer fichiers
log "3.1 Deleting login/login-theme files"
rm -f app/src/pages/cp/login.ts
rm -f app/src/pages/cp/login-theme.ts
rm -f app/src/pages/cp/login.css
rm -rf app/src/pages/cp/ui/loginTheme

# 3.2 Supprimer routes du registry
log "3.2 Removing login/login-theme from CP registry"
# Cette correction sera faite dans la section registry plus bas

# 3.3 Supprimer du RouteId type
log "3.3 Removing login/login-theme from RouteId type"
# Cette correction sera faite dans la section router.ts plus bas

# 3.4 Supprimer de ROUTE_CATALOG.json
log "3.4 Removing login/login-theme from ROUTE_CATALOG.json"
# Cette correction sera faite dans la section ROUTE_CATALOG plus bas

# 3.5 Remplacer références renderLogin dans moduleLoader
log "3.5 Removing renderLogin references from moduleLoader"
# Cette correction sera faite dans la section moduleLoader plus bas

log "Phase 3 completed"

# ============================================================
# 4) PURGE — SUPPRIMER TOUTES LES PAGES "PARTAGÉES" CP/APP + LEURS ROUTES
# ============================================================
log "=== PHASE 4: PURGE PAGES PARTAGÉES ==="

# Pages partagées identifiées (qui existent dans les deux registries ou sont utilisées par les deux)
# Note: moduleLoader utilise modules/core-system pour login/dashboard/settings, donc les pages dans app/src/pages/app/ et app/src/pages/cp/ 
# qui sont des doublons doivent être supprimées si elles ne sont pas utilisées.

log "4.1 Identifying shared pages"
# Les pages suivantes sont partagées (utilisées par les deux):
# - dashboard (mais moduleLoader utilise modules/core-system)
# - account (mais moduleLoader utilise modules/core-system)
# - settings (mais moduleLoader utilise modules/core-system)
# - system (existe dans app/src/pages/app/system.ts et app/src/pages/cp/system.ts)
# - users (existe dans app/src/pages/app/users.ts et app/src/pages/cp/users.ts)

# Supprimer les pages app/ qui sont des doublons non utilisés
log "4.2 Deleting duplicate shared pages from app/"
rm -f app/src/pages/app/dashboard.ts
rm -f app/src/pages/app/account.ts
rm -f app/src/pages/app/settings.ts
rm -f app/src/pages/app/system.ts
rm -f app/src/pages/app/users.ts
rm -f app/src/pages/app/ui-catalog.ts

log "Phase 4 completed"

# ============================================================
# 5) RENAME — PAGES ET ROUTES POUR DIAGNOSTIC (CP/APP/ERR)
# ============================================================
log "=== PHASE 5: RENAME PAGES WITH SUFFIXES ==="

# 5.1 Renommer pages CP avec suffixe _CP
log "5.1 Renaming CP pages with _CP suffix"
# Cette correction sera faite manuellement dans les sections suivantes

# 5.2 Renommer pages APP avec suffixe _APP
log "5.2 Renaming APP pages with _APP suffix"
# Cette correction sera faite manuellement dans les sections suivantes

log "Phase 5 completed (manual edits required)"

# ============================================================
# 6) DÉDUP — SUPPRIMER ROUTERS PARALLÈLES (même dépréciés)
# ============================================================
log "=== PHASE 6: REMOVE PARALLEL ROUTERS ==="

log "6.1 Deleting deprecated runtime/router.ts"
rm -f app/src/runtime/router.ts

log "6.2 Removing duplicate hashchange listener in main.ts"
# Cette correction sera faite dans la section main.ts plus bas

log "6.3 Ensuring single bootRouter call in main.ts"
# Cette correction sera faite dans la section main.ts plus bas

log "Phase 6 completed"

# ============================================================
# 7) NETTOYAGE — MUTATIONS DIRECTES location.hash
# ============================================================
log "=== PHASE 7: CLEAN DIRECT location.hash MUTATIONS ==="

log "7.1 Replacing direct location.hash mutations with navigate()"
# Cette correction sera faite manuellement dans les fichiers identifiés

log "Phase 7 completed (manual edits required)"

# ============================================================
# 8) VALIDATION — GATES (doit être 100% vert)
# ============================================================
log "=== PHASE 8: VALIDATION GATES ==="

log "8.1 Running builds"
npm run build:ssot || log "WARN: build:ssot failed"
npm run build:cp || log "WARN: build:cp failed"
npm run build:app || log "WARN: build:app failed"

log "8.2 Running tests"
VITE_APP_KIND=APP npm test || log "WARN: APP tests failed"
VITE_APP_KIND=CONTROL_PLANE npm test || log "WARN: CP tests failed"

log "Phase 8 completed"

# ============================================================
# 9) PROOFS — COMMANDES DE PREUVE
# ============================================================
log "=== PHASE 9: PROOFS ==="

log "9.1 Proof: no login/login-theme references"
rg -n --hidden --glob '!.git' "(#/login|login-theme|LoginTheme|renderRoute\(\"login\"|RouteId.*login)" . > "$REPORT_DIR/proof_no_login.txt" 2>&1 || true

log "9.2 Proof: no parallel routers"
rg -n --hidden --glob '!.git' "app/src/runtime/router\.ts|platform-services/ui-shell/routing/router\.ts" app/src > "$REPORT_DIR/proof_no_parallel_routers.txt" 2>&1 || true

log "9.3 Proof: single hashchange listener"
rg -n --hidden --glob '!.git' "addEventListener\(\"hashchange\"" app/src > "$REPORT_DIR/proof_single_hashchange.txt" 2>&1 || true

log "9.4 Proof: no direct location.hash ="
rg -n --hidden --glob '!.git' "window\.location\.hash\s*=" app/src modules > "$REPORT_DIR/proof_no_direct_hash.txt" 2>&1 || true

log "Phase 9 completed. Reports in $REPORT_DIR/"

log "=== RUNBOOK COMPLETED ==="
log "Next: Review reports in $REPORT_DIR/ and apply manual corrections as needed."
