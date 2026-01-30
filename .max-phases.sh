#!/usr/bin/env bash
# =========================================================
# MAX PHASES — Transformation working tree → commits atomiques gouvernés
# Objectif: découper un working tree massif en micro-commits scopés,
# vérifiés, sans régression, sans fuite $HOME/, avec proofs après chaque phase.
# =========================================================
set -euo pipefail
HOME_ROOT="${HOME%/*}"
export LC_ALL=C

# -------------------------
# PHASE 0 — Context / Guardrails
# -------------------------
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
CURRENT_DIR="$(pwd -P)"

if [[ "$CURRENT_DIR" != "$REPO_ROOT" ]]; then
  echo "ERR: must run from repo root"
  echo "REPO_ROOT: $REPO_ROOT"
  echo "CURRENT:   $CURRENT_DIR"
  exit 1
fi

cd "$REPO_ROOT"

RUN_ID="$(date +%Y%m%d_%H%M%S)"
REPORTS_DIR="_REPORTS/max-phases/${RUN_ID}"
mkdir -p "$REPORTS_DIR"

echo "============================================================"
echo "PHASE 0 — CONTEXT"
echo "============================================================"
echo "REPO_ROOT: $REPO_ROOT"
echo "BRANCH   : $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'detached')"
echo "HEAD     : $(git rev-parse --short HEAD 2>/dev/null || echo 'N/A')"
echo "NODE     : $(node -v 2>/dev/null || echo 'N/A')"
echo "NPM      : $(npm -v 2>/dev/null || echo 'N/A')"
echo "RUN_ID   : $RUN_ID"
echo "REPORTS  : $REPORTS_DIR"
echo

# Pre-check: staging must be empty
STAGED_INIT="$(git diff --cached --name-only 2>/dev/null | tr -d '\r' || true)"
if [[ -n "${STAGED_INIT// }" ]]; then
  echo "ERR: staging not empty. Clean first:"
  echo "$STAGED_INIT" | sed 's/^/  - /'
  exit 10
fi

# Helper: run command with logging
run_cmd() {
  local label="$1"
  shift
  local log_file="${REPORTS_DIR}/cmd_${label}.log"
  local start_time
  start_time=$(date +%s)
  
  echo "=== RUN: $label ==="
  echo "CMD: $*"
  echo "LOG: $log_file"
  
  if "$@" > "$log_file" 2>&1; then
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    echo "OK: $label (${duration}s)"
    return 0
  else
    local rc=$?
    local end_time
    end_time=$(date +%s)
    local duration=$((end_time - start_time))
    echo "ERR: $label failed (exit $rc, ${duration}s)"
    echo "See: $log_file"
    return $rc
  fi
}

# Helper: stage files (check existence, handle deleted)
stage_files() {
  local files="$1"
  local staged_count=0
  local skipped_count=0
  
  while IFS= read -r f; do
    [[ -z "${f// }" ]] && continue
    [[ "$f" =~ ^# ]] && continue
    
    if [[ ! -e "$f" ]]; then
      # File deleted: use git rm if tracked, otherwise skip
      if git ls-files --error-unmatch -- "$f" >/dev/null 2>&1; then
        git rm --cached -- "$f" 2>/dev/null || true
        ((staged_count++)) || true
      else
        ((skipped_count++)) || true
      fi
    else
      git add -- "$f" 2>/dev/null || true
      ((staged_count++)) || true
    fi
  done <<< "$files"
  
  echo "  staged: $staged_count, skipped: $skipped_count"
  return 0
}

# Helper: commit phase (only if staged non-empty, check $HOME/ leak)
commit_phase() {
  local scope="$1"
  local msg="$2"
  shift 2
  local files="$*"
  
  # Stage files
  if [[ -n "$files" ]]; then
    stage_files "$files"
  fi
  
  # Check if anything staged
  local staged
  staged="$(git diff --cached --name-only 2>/dev/null | tr -d '\r' || true)"
  if [[ -z "${staged// }" ]]; then
    echo "SKIP: nothing staged for commit: $msg"
    return 0
  fi
  
  # CRITICAL: Check for $HOME/ leak in staged files
  if git diff --cached | grep -n "$HOME/" >/dev/null 2>&1; then
    echo "ERR: $HOME/ leak detected in staged files!"
    git diff --cached | grep -n "$HOME/" | head -10
    echo "ABORT: commit blocked to prevent $HOME/ leak"
    git reset
    exit 20
  fi
  
  echo "== STAGED FOR COMMIT =="
  echo "$staged" | sed 's/^/  - /'
  echo
  
  # Commit (hooks will run)
  if run_cmd "commit_${scope}" git commit -m "$msg"; then
    echo "OK: committed phase $scope"
    return 0
  else
    echo "ERR: commit failed for phase $scope"
    echo "See: ${REPORTS_DIR}/cmd_commit_${scope}.log"
    exit 21
  fi
}

# Helper: proof light (fast checks after each commit)
proof_light() {
  local phase_name="$1"
  local log_file="${REPORTS_DIR}/proof_light_${phase_name}.log"
  
  echo
  echo "=== PROOF LIGHT: $phase_name ==="
  
  {
    echo "=== audit-no-leaks ==="
    if [[ -x ".githooks/pre-commit" ]]; then
      bash .githooks/pre-commit 2>&1 | grep -E "(audit-no-leaks|ERR|OK)" || true
    elif [[ -f "scripts/audit/audit-no-leaks.zsh" ]]; then
      bash scripts/audit/audit-no-leaks.zsh 2>&1 || true
    fi
    
    echo
    echo "=== gate:ssot:paths ==="
    npm -s run -S gate:ssot:paths 2>&1 || true
    
    echo
    echo "=== gate:gates:sanity ==="
    npm -s run -S gate:gates:sanity 2>&1 || true
  } > "$log_file" 2>&1
  
  if grep -qE "(ERR|FAIL|Error)" "$log_file" 2>/dev/null; then
    echo "WARN: proof_light found issues (see $log_file)"
    tail -20 "$log_file"
  else
    echo "OK: proof_light passed"
  fi
}

# Helper: proofs all (full suite at end)
proofs_all() {
  local log_file="${REPORTS_DIR}/proofs_all.log"
  
  echo
  echo "============================================================"
  echo "PROOFS — FULL"
  echo "============================================================"
  
  {
    echo "=== audit-chemins-non-regression ==="
    if [[ -f "scripts/audit/audit-chemins-non-regression.sh" ]]; then
      bash scripts/audit/audit-chemins-non-regression.sh 2>&1 || true
    elif [[ -f "docs/reports/audit-chemins-non-regression.sh" ]]; then
      bash docs/reports/audit-chemins-non-regression.sh 2>&1 || true
    fi
    
    echo
    echo "=== gate:ssot:paths ==="
    npm -s run -S gate:ssot:paths 2>&1 || true
    
    echo
    echo "=== gate:ssot ==="
    npm -s run -S gate:ssot 2>&1 || true
    
    echo
    echo "=== gate:routing:ssot ==="
    npm -s run -S gate:routing:ssot 2>&1 || true
    
    echo
    echo "=== gate:gates:sanity ==="
    npm -s run -S gate:gates:sanity 2>&1 || true
    
    echo
    echo "=== build:cp ==="
    npm -s run -S build:cp 2>&1 || true
    
    echo
    echo "=== build:app ==="
    npm -s run -S build:app 2>&1 || true
  } > "$log_file" 2>&1
  
  if grep -qE "(ERR|FAIL|Error)" "$log_file" 2>/dev/null; then
    echo "WARN: some proofs failed (see $log_file)"
    tail -30 "$log_file"
  else
    echo "OK: all proofs passed"
  fi
}

# Helper: get files matching patterns (dedup against already committed)
get_files_by_pattern() {
  local patterns="$1"
  local exclude_file="$2"
  local files=""
  
  # Build exclude list from already committed files
  local exclude_list=""
  if [[ -f "$exclude_file" ]]; then
    exclude_list="$(cat "$exclude_file" | tr '\n' '|' | sed 's/|$//')"
  fi
  
  # Get files matching patterns
  while IFS= read -r pattern; do
    [[ -z "${pattern// }" ]] && continue
    
    # Use git ls-files for tracked, find for untracked
    local matched
    matched="$(git ls-files "$pattern" 2>/dev/null || true)"
    matched="$matched"$'\n'"$(git ls-files --others --exclude-standard "$pattern" 2>/dev/null || true)"
    
    while IFS= read -r f; do
      [[ -z "${f// }" ]] && continue
      
      # Exclude if already committed
      if [[ -n "$exclude_list" ]] && echo "$f" | grep -qE "^($exclude_list)$" 2>/dev/null; then
        continue
      fi
      
      # Add to files list
      if [[ -z "$files" ]]; then
        files="$f"
      else
        files="$files"$'\n'"$f"
      fi
    done <<< "$matched"
  done <<< "$patterns"
  
  echo "$files"
}

# Helper: get files from bucket (dedup)
get_files_from_bucket() {
  local bucket_file="$1"
  local exclude_file="$2"
  
  if [[ ! -f "$bucket_file" ]]; then
    return 0
  fi
  
  local files
  files="$(grep -vE '^\s*$' "$bucket_file" | grep -vE '^\s*#' || true)"
  
  # Dedup against exclude list
  if [[ -f "$exclude_file" ]]; then
    local exclude_list
    exclude_list="$(cat "$exclude_file" | tr '\n' '|' | sed 's/|$//')"
    if [[ -n "$exclude_list" ]]; then
      files="$(echo "$files" | grep -vE "^($exclude_list)$" || true)"
    fi
  fi
  
  echo "$files"
}

# -------------------------
# PHASE 1 — Generate buckets
# -------------------------
echo "============================================================"
echo "PHASE 1 — GENERATE TRIAGE BUCKETS"
echo "============================================================"

# Check triage script exists and has no $HOME/ leak
if [[ -f ".triage-working-tree.sh" ]]; then
  if grep -n "$HOME/" .triage-working-tree.sh >/dev/null 2>&1; then
    echo "ERR: $HOME/ leak in .triage-working-tree.sh"
    grep -n "$HOME/" .triage-working-tree.sh
    exit 11
  fi
fi

# Generate buckets
if [[ -x ".triage-working-tree.sh" ]] || [[ -f ".triage-working-tree.sh" ]]; then
  run_cmd "triage_buckets" bash .triage-working-tree.sh
else
  echo "WARN: .triage-working-tree.sh not found"
fi

# Find latest timestamp from buckets
latest_ts() {
  ls -1 .triage/bucket_*.txt 2>/dev/null | sed -n 's/.*_\([0-9]\{8\}_[0-9]\{6\}\)\.txt/\1/p' | sort -u | tail -n 1 || true
}

TS="$(latest_ts)"
echo "TRIAGE_TS: ${TS:-N/A}"
echo

# Track committed files (for dedup)
COMMITTED_FILE="${REPORTS_DIR}/committed_files.txt"
touch "$COMMITTED_FILE"

# -------------------------
# PHASE 2 — Plan phases
# -------------------------
echo "============================================================"
echo "PHASE 2 — PLAN PHASES"
echo "============================================================"

cat > "${REPORTS_DIR}/phase_plan.txt" <<'PLAN_EOF'
A) hooks & ci: .githooks/* .github/workflows/*
B) scripts/gates: scripts/gates/*
C) scripts/triage: scripts/*.sh .triage-working-tree.sh
D) server: server/*
E) platform-services: platform-services/*
F) modules/ui/shared: modules/core-system/ui/frontend-ts/shared/*
F1) modules/ui/pages/shared: modules/core-system/ui/frontend-ts/pages/_shared/*
F2) modules/ui/pages/login: modules/core-system/ui/frontend-ts/pages/login/*
F3) modules/ui/pages/access-denied: modules/core-system/ui/frontend-ts/pages/access-denied/*
F4) modules/ui/pages/activation: modules/core-system/ui/frontend-ts/pages/activation/*
F5) modules/ui/pages/blocked: modules/core-system/ui/frontend-ts/pages/blocked/*
F6) modules/ui/pages/dashboard: modules/core-system/ui/frontend-ts/pages/dashboard.*
F7) modules/ui/pages/developer: modules/core-system/ui/frontend-ts/pages/developer/*
F8) modules/ui/pages/logs: modules/core-system/ui/frontend-ts/pages/logs/*
F9) modules/ui/pages/settings: modules/core-system/ui/frontend-ts/pages/settings/*
F10) modules/ui/pages/system: modules/core-system/ui/frontend-ts/pages/system/*
F11) modules/ui/pages/toolbox: modules/core-system/ui/frontend-ts/pages/toolbox/*
F12) modules/ui/pages/verification: modules/core-system/ui/frontend-ts/pages/verification/*
G) app/runtime: app/src/runtime/*
H) app/core/entitlements: app/src/core/entitlements/*
H1) app/core/studio: app/src/core/studio/*
H2) app/core/ui: app/src/core/ui/*
H3) app/core/ssot: app/src/core/ssot/*
H4) app/core/control-plane: app/src/core/control-plane/*
H5) app/core/runtime: app/src/core/runtime/*
H6) app/core/utils: app/src/core/utils/*
I) app/pages/cp/shared: app/src/pages/cp/_shared/*
I1) app/pages/cp/audit: app/src/pages/cp/audit.*
I2) app/pages/cp/dashboard: app/src/pages/cp/dashboard.*
I3) app/pages/cp/entitlements: app/src/pages/cp/entitlements.*
I4) app/pages/cp/feature-flags: app/src/pages/cp/feature-flags.*
I5) app/pages/cp/login: app/src/pages/cp/login.*
I6) app/pages/cp/login-theme: app/src/pages/cp/login-theme.*
I7) app/pages/cp/pages: app/src/pages/cp/pages.*
I8) app/pages/cp/publish: app/src/pages/cp/publish.*
I9) app/pages/cp/registry: app/src/pages/cp/registry.*
I10) app/pages/cp/subscription: app/src/pages/cp/subscription.*
I11) app/pages/cp/tenants: app/src/pages/cp/tenants.*
I12) app/pages/cp/integrations: app/src/pages/cp/integrations.*
J) app/pages/app/shared: app/src/pages/_shared/*
J1) app/pages/app/client-access-denied: app/src/pages/app/client-access-denied.*
J2) app/pages/app/client-catalog: app/src/pages/app/client-catalog.*
J3) app/pages/app/client-disabled: app/src/pages/app/client-disabled.*
J4) app/pages/app/client-account: app/src/pages/app/client-account.*
J5) app/pages/app/client-dashboard: app/src/pages/app/client-dashboard.*
J6) app/pages/app/client-settings: app/src/pages/app/client-settings.*
J7) app/pages/app/client-system: app/src/pages/app/client-system.*
J8) app/pages/app/client-users: app/src/pages/app/client-users.*
J9) app/pages/app/account: app/src/pages/app/account.*
J10) app/pages/app/dashboard: app/src/pages/app/dashboard.*
J11) app/pages/app/settings: app/src/pages/app/settings.*
J12) app/pages/app/system: app/src/pages/app/system.*
J13) app/pages/app/users: app/src/pages/app/users.*
K) app/tests: app/src/__tests__/*
L) app/styles: app/src/styles/*
M) app/config: app/index.html app/vite.config.ts app/vitest.setup.ts
N) app/main: app/src/main.ts app/src/moduleLoader.ts app/src/router.ts
O) docs/runbooks: docs/runbooks/*
P) docs/reports: docs/reports/*
Q) docs/phase: docs/PHASE_*/*
R) docs/governance: docs/governance/*
S) docs/other: docs/*.md
T) config: config/* .env.example
U) root: CONTRIBUTING.md *.md
V) other: catch-all from bucket_other
PLAN_EOF

cat "${REPORTS_DIR}/phase_plan.txt"
echo

# -------------------------
# PHASE 3+ — Execute phases
# -------------------------
echo "============================================================"
echo "PHASE 3+ — EXECUTE MICRO-PHASES"
echo "============================================================"

# Phase A: hooks & ci
echo "--- Phase A: hooks & ci ---"
files="$(get_files_by_pattern ".githooks/*"$'\n'".github/workflows/*" "$COMMITTED_FILE")"
if [[ -n "$files" ]]; then
  commit_phase "A" "chore(hooks): hooks and CI workflows" "$files"
  echo "$files" >> "$COMMITTED_FILE"
  proof_light "A"
  git reset
fi

# Phase B: scripts/gates
echo "--- Phase B: scripts/gates ---"
files="$(get_files_by_pattern "scripts/gates/*" "$COMMITTED_FILE")"
if [[ -z "$files" ]] && [[ -n "${TS:-}" ]]; then
  files="$(get_files_from_bucket ".triage/bucket_scripts_gates_${TS}.txt" "$COMMITTED_FILE")"
fi
if [[ -n "$files" ]]; then
  commit_phase "B" "chore(scripts): gates scripts" "$files"
  echo "$files" >> "$COMMITTED_FILE"
  proof_light "B"
  git reset
fi

# Phase C: scripts/triage
echo "--- Phase C: scripts/triage ---"
files="$(get_files_by_pattern "scripts/*.sh"$'\n'".triage-working-tree.sh" "$COMMITTED_FILE")"
if [[ -n "$files" ]]; then
  commit_phase "C" "chore(scripts): triage and utility scripts" "$files"
  echo "$files" >> "$COMMITTED_FILE"
  proof_light "C"
  git reset
fi

# Phase D: server
echo "--- Phase D: server ---"
files="$(get_files_by_pattern "server/*" "$COMMITTED_FILE")"
if [[ -z "$files" ]] && [[ -n "${TS:-}" ]]; then
  files="$(get_files_from_bucket ".triage/bucket_server_${TS}.txt" "$COMMITTED_FILE")"
fi
if [[ -n "$files" ]]; then
  commit_phase "D" "chore(server): server runtime config" "$files"
  echo "$files" >> "$COMMITTED_FILE"
  proof_light "D"
  git reset
fi

# Phase E: platform-services
echo "--- Phase E: platform-services ---"
files="$(get_files_by_pattern "platform-services/*" "$COMMITTED_FILE")"
if [[ -n "$files" ]]; then
  commit_phase "E" "chore(platform-services): UI shell layout" "$files"
  echo "$files" >> "$COMMITTED_FILE"
  proof_light "E"
  git reset
fi

# Phase F: modules/ui (shared first)
echo "--- Phase F: modules/ui/shared ---"
files="$(get_files_by_pattern "modules/core-system/ui/frontend-ts/shared/*" "$COMMITTED_FILE")"
if [[ -z "$files" ]] && [[ -n "${TS:-}" ]]; then
  files="$(get_files_from_bucket ".triage/bucket_modules_ui_${TS}.txt" "$COMMITTED_FILE")"
  files="$(echo "$files" | grep "shared/" || true)"
fi
if [[ -n "$files" ]]; then
  commit_phase "F" "chore(modules): UI shared components" "$files"
  echo "$files" >> "$COMMITTED_FILE"
  proof_light "F"
  git reset
fi

# Phase F1-F12: modules/ui pages (sub-phases)
for sub in "F1:pages/_shared:_shared" "F2:pages/login:login" "F3:pages/access-denied:access-denied" "F4:pages/activation:activation" "F5:pages/blocked:blocked" "F6:pages/dashboard:dashboard" "F7:pages/developer:developer" "F8:pages/logs:logs" "F9:pages/settings:settings" "F10:pages/system:system" "F11:pages/toolbox:toolbox" "F12:pages/verification:verification"; do
  phase_id="${sub%%:*}"
  path_part="${sub#*:}"
  pattern="${path_part%%:*}"
  name="${path_part#*:}"
  echo "--- Phase $phase_id: modules/ui/$name ---"
  files="$(get_files_by_pattern "modules/core-system/ui/frontend-ts/${pattern}/*" "$COMMITTED_FILE")"
  if [[ -n "$files" ]]; then
    commit_phase "$phase_id" "chore(modules): UI $name pages" "$files"
    echo "$files" >> "$COMMITTED_FILE"
    proof_light "$phase_id"
    git reset
  fi
done

# Phase G: app/runtime
echo "--- Phase G: app/runtime ---"
files="$(get_files_by_pattern "app/src/runtime/*" "$COMMITTED_FILE")"
if [[ -n "$files" ]]; then
  commit_phase "G" "chore(app): runtime router and safeRender" "$files"
  echo "$files" >> "$COMMITTED_FILE"
  proof_light "G"
  git reset
fi

# Phase H: app/core (sub-phases)
for sub in "H:core/entitlements:entitlements" "H1:core/studio:studio" "H2:core/ui:UI components" "H3:core/ssot:SSOT" "H4:core/control-plane:control-plane" "H5:core/runtime:runtime" "H6:core/utils:utils"; do
  phase_id="${sub%%:*}"
  path_part="${sub#*:}"
  pattern="${path_part%%:*}"
  name="${path_part#*:}"
  echo "--- Phase $phase_id: app/$pattern ---"
  files="$(get_files_by_pattern "app/src/${pattern}/*" "$COMMITTED_FILE")"
  if [[ -n "$files" ]]; then
    commit_phase "$phase_id" "chore(app): $name" "$files"
    echo "$files" >> "$COMMITTED_FILE"
    proof_light "$phase_id"
    git reset
  fi
done

# Phase I: app/pages/cp (sub-phases)
for sub in "I:pages/cp/_shared:CP shared" "I1:pages/cp/audit:CP audit" "I2:pages/cp/dashboard:CP dashboard" "I3:pages/cp/entitlements:CP entitlements" "I4:pages/cp/feature-flags:CP feature-flags" "I5:pages/cp/login:CP login" "I6:pages/cp/login-theme:CP login-theme" "I7:pages/cp/pages:CP pages" "I8:pages/cp/publish:CP publish" "I9:pages/cp/registry:CP registry" "I10:pages/cp/subscription:CP subscription" "I11:pages/cp/tenants:CP tenants" "I12:pages/cp/integrations:CP integrations"; do
  phase_id="${sub%%:*}"
  path_part="${sub#*:}"
  pattern="${path_part%%:*}"
  name="${path_part#*:}"
  echo "--- Phase $phase_id: app/$pattern ---"
  files="$(get_files_by_pattern "app/src/${pattern}.*" "$COMMITTED_FILE")"
  if [[ -z "$files" ]]; then
    files="$(get_files_by_pattern "app/src/${pattern}/*" "$COMMITTED_FILE")"
  fi
  if [[ -z "$files" ]] && [[ -n "${TS:-}" ]]; then
    files="$(get_files_from_bucket ".triage/bucket_app_pages_cp_${TS}.txt" "$COMMITTED_FILE")"
    files="$(echo "$files" | grep "${pattern}" || true)"
  fi
  if [[ -n "$files" ]]; then
    commit_phase "$phase_id" "chore(cp): $name" "$files"
    echo "$files" >> "$COMMITTED_FILE"
    proof_light "$phase_id"
    git reset
  fi
done

# Phase J: app/pages/app (sub-phases)
for sub in "J:pages/_shared:App shared" "J1:pages/app/client-access-denied:client-access-denied" "J2:pages/app/client-catalog:client-catalog" "J3:pages/app/client-disabled:client-disabled" "J4:pages/app/client-account:client-account" "J5:pages/app/client-dashboard:client-dashboard" "J6:pages/app/client-settings:client-settings" "J7:pages/app/client-system:client-system" "J8:pages/app/client-users:client-users" "J9:pages/app/account:account" "J10:pages/app/dashboard:dashboard" "J11:pages/app/settings:settings" "J12:pages/app/system:system" "J13:pages/app/users:users"; do
  phase_id="${sub%%:*}"
  path_part="${sub#*:}"
  pattern="${path_part%%:*}"
  name="${path_part#*:}"
  echo "--- Phase $phase_id: app/$pattern ---"
  files="$(get_files_by_pattern "app/src/${pattern}.*" "$COMMITTED_FILE")"
  if [[ -z "$files" ]]; then
    files="$(get_files_by_pattern "app/src/${pattern}/*" "$COMMITTED_FILE")"
  fi
  if [[ -z "$files" ]] && [[ -n "${TS:-}" ]]; then
    files="$(get_files_from_bucket ".triage/bucket_app_pages_app_${TS}.txt" "$COMMITTED_FILE")"
    files="$(echo "$files" | grep "${pattern}" || true)"
  fi
  if [[ -n "$files" ]]; then
    commit_phase "$phase_id" "chore(app): $name" "$files"
    echo "$files" >> "$COMMITTED_FILE"
    proof_light "$phase_id"
    git reset
  fi
done

# Phase K: app/tests
echo "--- Phase K: app/tests ---"
files="$(get_files_by_pattern "app/src/__tests__/*" "$COMMITTED_FILE")"
if [[ -n "$files" ]]; then
  commit_phase "K" "test(app): contract tests" "$files"
  echo "$files" >> "$COMMITTED_FILE"
  proof_light "K"
  git reset
fi

# Phase L: app/styles
echo "--- Phase L: app/styles ---"
files="$(get_files_by_pattern "app/src/styles/*" "$COMMITTED_FILE")"
if [[ -z "$files" ]] && [[ -n "${TS:-}" ]]; then
  files="$(get_files_from_bucket ".triage/bucket_app_ui_${TS}.txt" "$COMMITTED_FILE")"
  files="$(echo "$files" | grep "styles/" || true)"
fi
if [[ -n "$files" ]]; then
  commit_phase "L" "chore(app): styles" "$files"
  echo "$files" >> "$COMMITTED_FILE"
  proof_light "L"
  git reset
fi

# Phase M: app/config
echo "--- Phase M: app/config ---"
files="$(get_files_by_pattern "app/index.html"$'\n'"app/vite.config.ts"$'\n'"app/vitest.setup.ts" "$COMMITTED_FILE")"
if [[ -n "$files" ]]; then
  commit_phase "M" "chore(app): config files" "$files"
  echo "$files" >> "$COMMITTED_FILE"
  proof_light "M"
  git reset
fi

# Phase N: app/main
echo "--- Phase N: app/main ---"
files="$(get_files_by_pattern "app/src/main.ts"$'\n'"app/src/moduleLoader.ts"$'\n'"app/src/router.ts" "$COMMITTED_FILE")"
if [[ -n "$files" ]]; then
  commit_phase "N" "chore(app): main entry and router" "$files"
  echo "$files" >> "$COMMITTED_FILE"
  proof_light "N"
  git reset
fi

# Phase O: docs/runbooks
echo "--- Phase O: docs/runbooks ---"
files="$(get_files_by_pattern "docs/runbooks/*" "$COMMITTED_FILE")"
if [[ -n "$files" ]]; then
  commit_phase "O" "docs: runbooks" "$files"
  echo "$files" >> "$COMMITTED_FILE"
  proof_light "O"
  git reset
fi

# Phase P: docs/reports
echo "--- Phase P: docs/reports ---"
files="$(get_files_by_pattern "docs/reports/*" "$COMMITTED_FILE")"
if [[ -n "$files" ]]; then
  commit_phase "P" "docs: reports" "$files"
  echo "$files" >> "$COMMITTED_FILE"
  proof_light "P"
  git reset
fi

# Phase Q: docs/phase
echo "--- Phase Q: docs/phase ---"
files="$(get_files_by_pattern "docs/PHASE_*/*" "$COMMITTED_FILE")"
if [[ -z "$files" ]] && [[ -n "${TS:-}" ]]; then
  files="$(get_files_from_bucket ".triage/bucket_docs_${TS}.txt" "$COMMITTED_FILE")"
  files="$(echo "$files" | grep "PHASE_" || true)"
fi
if [[ -n "$files" ]]; then
  commit_phase "Q" "docs: phase closeouts" "$files"
  echo "$files" >> "$COMMITTED_FILE"
  proof_light "Q"
  git reset
fi

# Phase R: docs/governance
echo "--- Phase R: docs/governance ---"
files="$(get_files_by_pattern "docs/governance/*" "$COMMITTED_FILE")"
if [[ -n "$files" ]]; then
  commit_phase "R" "docs: governance" "$files"
  echo "$files" >> "$COMMITTED_FILE"
  proof_light "R"
  git reset
fi

# Phase S: docs/other
echo "--- Phase S: docs/other ---"
files="$(get_files_by_pattern "docs/*.md" "$COMMITTED_FILE")"
if [[ -z "$files" ]] && [[ -n "${TS:-}" ]]; then
  files="$(get_files_from_bucket ".triage/bucket_docs_${TS}.txt" "$COMMITTED_FILE")"
fi
if [[ -n "$files" ]]; then
  commit_phase "S" "docs: other documentation" "$files"
  echo "$files" >> "$COMMITTED_FILE"
  proof_light "S"
  git reset
fi

# Phase T: config
echo "--- Phase T: config ---"
files="$(get_files_by_pattern "config/*"$'\n'".env.example" "$COMMITTED_FILE")"
if [[ -z "$files" ]] && [[ -n "${TS:-}" ]]; then
  files="$(get_files_from_bucket ".triage/bucket_config_${TS}.txt" "$COMMITTED_FILE")"
fi
if [[ -n "$files" ]]; then
  commit_phase "T" "chore(config): config files" "$files"
  echo "$files" >> "$COMMITTED_FILE"
  proof_light "T"
  git reset
fi

# Phase U: root
echo "--- Phase U: root ---"
files="$(get_files_by_pattern "CONTRIBUTING.md"$'\n'"*.md" "$COMMITTED_FILE")"
files="$(echo "$files" | grep -v "^docs/" || true)"
if [[ -n "$files" ]]; then
  commit_phase "U" "docs: root documentation" "$files"
  echo "$files" >> "$COMMITTED_FILE"
  proof_light "U"
  git reset
fi

# Phase V: other (catch-all from bucket_other)
echo "--- Phase V: other (catch-all) ---"
if [[ -n "${TS:-}" ]]; then
  files="$(get_files_from_bucket ".triage/bucket_other_${TS}.txt" "$COMMITTED_FILE")"
  if [[ -n "$files" ]]; then
    commit_phase "V" "chore(misc): other scoped changes" "$files"
    echo "$files" >> "$COMMITTED_FILE"
    proof_light "V"
    git reset
  fi
fi

# Handle explicit deletions
if [[ -n "${TS:-}" ]] && [[ -f ".triage/deleted_${TS}.txt" ]]; then
  echo "--- Phase DEL: explicit deletions ---"
  files="$(grep -vE '^\s*$' ".triage/deleted_${TS}.txt" | grep -vE '^\s*#' || true)"
  if [[ -n "$files" ]]; then
    while IFS= read -r f; do
      [[ -z "${f// }" ]] && continue
      if git ls-files --error-unmatch -- "$f" >/dev/null 2>&1; then
        git rm --cached -- "$f" 2>/dev/null || true
      fi
    done <<< "$files"
    staged="$(git diff --cached --name-only 2>/dev/null || true)"
    if [[ -n "${staged// }" ]]; then
      commit_phase "DEL" "chore(cleanup): explicit deletions" ""
      echo "$files" >> "$COMMITTED_FILE"
      proof_light "DEL"
      git reset
    fi
  fi
fi

# -------------------------
# PHASE FINAL — Post checks & proofs
# -------------------------
echo
echo "============================================================"
echo "PHASE FINAL — POST CHECKS"
echo "============================================================"

echo "== POST: staged must be empty =="
STAGED_FINAL="$(git diff --cached --name-only 2>/dev/null | tr -d '\r' || true)"
if [[ -n "${STAGED_FINAL// }" ]]; then
  echo "WARN: staged files remain after all phases:"
  echo "$STAGED_FINAL" | sed 's/^/  - /'
else
  echo "OK: staging is clean"
fi
echo

echo "== STATUS (top 120) =="
git status --porcelain | head -n 120 || true
echo

# Full proofs
proofs_all

# -------------------------
# FINAL REPORT
# -------------------------
echo
echo "============================================================"
echo "FINAL REPORT"
echo "============================================================"
echo "== LOG (last 30) =="
git --no-pager log --oneline -n 30
echo
echo "== STATUS (top 120) =="
git status --porcelain | head -n 120 || true
echo
echo "== COMMITTED FILES COUNT =="
committed_count=$(wc -l < "$COMMITTED_FILE" | tr -d ' ' || echo "0")
echo "Total files committed: $committed_count"
echo
echo "== REPORTS =="
echo "All logs and reports in: $REPORTS_DIR"
ls -lh "$REPORTS_DIR" | head -20 || true
echo
echo "OK: MAX PHASES run completed (micro-commits by phases + proofs)."
echo "RUN_ID: $RUN_ID"
