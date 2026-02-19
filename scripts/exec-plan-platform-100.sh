#!/usr/bin/env bash
# =====================================================================
# CURSOR EXEC PLAN — iCONTROL "100/100 PLATFORM"
# Scope: UI CP refactor (Users), Write Gateway enforcement, Zero-Trust
# hardening, Multi-tenant DB hardening, Perf/Pagination/Caching endgame.
# =====================================================================
# Usage: ./scripts/exec-plan-platform-100.sh
# Output: runtime/reports/PLATFORM_100_FINAL_<ts>.md
# =====================================================================

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")/.." && pwd)"
cd "$ROOT"

TS="$(date +"%Y%m%d_%H%M%S")"
REPORT="$ROOT/runtime/reports/PLATFORM_100_FINAL_${TS}.md"
mkdir -p "$ROOT/runtime/reports"

log() { printf "%s\n" "$*" | tee -a "$REPORT" ; }
section() { log ""; log "## $*"; }

log "# PLATFORM 100/100 — Execution Report"
log "- TS: $TS"
log "- ROOT: $ROOT"
log "- Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'n/a')"
log "- HEAD: $(git rev-parse --short HEAD 2>/dev/null || echo 'n/a')"
log ""

# -------------------------------------------------------
# 0) Target Definition (DoD)
# -------------------------------------------------------
section "0) Target Definition (DoD)"
log "PLATFORM 100/100 means:"
log "- UI CP: all pages follow PageShell + SectionCard + CSS module OR a single documented design system strategy (no mixed ad-hoc)"
log "- No direct localStorage/sessionStorage in CP + APP surfaces"
log "- No inline styles in CP surfaces"
log "- No innerHTML-based rendering in CP pages"
log "- All mutations (POST/PUT/PATCH/DELETE to /api) go through Write Gateway"
log "- Zero-Trust: all /api/* require Authorization Bearer except /api/health + /api/auth/*; tenantId from JWT tid; scopes enforced"
log "- Multi-tenant: every tenant-relevant table has tenant_id; all SELECT/UPDATE/DELETE tenant-scoped"
log "- Performance: cursor pagination everywhere; caching read-heavy GET only, tenant-safe; p95 < 120ms on /api/cp/audit"
log "- Gates: gate:no-direct-writes, gate:no-inline-styles, gate:tenant-scoping, gate:write-gateway-enforcement, gate:governance-100 OK"
log ""

# -------------------------------------------------------
# 1) UI CP: USERS page refactor (close biggest UI deficit)
# -------------------------------------------------------
section "1) UI CP — Users Page refactor (target: < 350 LOC Page.tsx)"
log "Goal: Replace legacy imperative + innerHTML in users/Page.tsx; use useUsersQueries + useUsersCommands."
log "Components: UsersTable.tsx, UsersDrawer.tsx; PageShell + UsersPage.module.css."
log "Acceptance: No innerHTML, no direct fetch in Page.tsx; commands via write gateway/commands layer."
log "- TODO(CURSOR): Implement UsersTable.tsx + UsersDrawer.tsx + rewrite users/Page.tsx to < 350 LOC"
log ""

# -------------------------------------------------------
# 2) UI CP unification: PageShell adoption on top offenders
# -------------------------------------------------------
section "2) UI CP — Standardize PageShell/SectionCard across top pages"
log "Priority: providers/Page.tsx (finalize CSS module + Section), pages/Page.tsx, dashboard/Page.tsx, security/policies (useCpPref)."
log "- TODO(CURSOR): Apply PageShell/SectionCard + CSS module on providers/pages/security/policies/dashboard (phased)"
log ""

# -------------------------------------------------------
# 3) Write Gateway: eliminate remaining mutation bypasses
# -------------------------------------------------------
section "3) Write Gateway — 0 mutation bypass (CP + APP)"
log "All POST/PUT/PATCH/DELETE to /api via platform/write-gateway OR platform/commands."
log "Extend gate-write-gateway-enforcement: remove legacy allowlist incrementally."
log "- TODO(CURSOR): Scan and migrate mutation fetches to commands/write-gateway"
log "  rg -n \"fetch\\(.*\\/api\\/.*\" apps/control-plane/src | rg \"POST|PUT|PATCH|DELETE\""
log ""

# -------------------------------------------------------
# 4) Zero-Trust Auth: lock down + least privilege + lifecycle
# -------------------------------------------------------
section "4) Zero-Trust Auth — Hardening"
log "A) DEV header compat opt-in: AUTH_COMPAT_HEADERS=true (default OFF)."
log "B) Standardize error envelope: { success:false, error, code, meta? }."
log "C) Scope model: cp:read, cp:write, tenant:admin, audit:read (optional)."
log "D) Token jti denylist or short TTL + refresh (already)."
log "E) Brute-force guard on /api/auth/login (rate limit)."
log "F) Contract tests: no token => 401; token without tid => 401/403; wrong scope => 403."
log "- TODO(CURSOR): AUTH_COMPAT_HEADERS opt-in, error shape, auth contract tests, login rate limit"
log ""

# -------------------------------------------------------
# 5) Multi-tenant DB hardening: make schema tenant-native
# -------------------------------------------------------
section "5) Multi-tenant DB — Structural hardening"
log "Target: providers + cp_pages add tenant_id NOT NULL DEFAULT 'default'; index (tenant_id, id DESC)."
log "Migration: ALTER TABLE + backfill; all queries/writes use getTenantId(req)."
log "Gates: extend no-global-select for providers/cp_pages."
log "- TODO(CURSOR): Add tenant_id to providers + cp_pages (migration + queries + indexes)"
log "- TODO(CURSOR): Extend gates: no-tenantless-select for providers/cp_pages"
log ""

# -------------------------------------------------------
# 6) Performance Phase 4+: UI pagination + caching invalidation
# -------------------------------------------------------
section "6) Performance Phase 4 — UI pagination, virtualization, cache invalidation"
log "API: cursor pagination + indexes + TTL cache + ETag already."
log "UI: Wire providers/pages/audit/logs to page.nextCursor/hasMore; Load more or infinite scroll."
log "Virtualization: react-virtual or manual for large tables."
log "Cache: versioned scopeHash or invalidate(keyPrefix) on write."
log "- TODO(CURSOR): Wire CP lists to cursor pagination"
log "- TODO(CURSOR): Add virtualization for long tables"
log "- TODO(CURSOR): Cache invalidation (versioned key or invalidate on write)"
log ""

# -------------------------------------------------------
# 7) Final governance gates + report
# -------------------------------------------------------
section "7) Run gates + generate final report"
log "Commands to run at end:"
log "  pnpm -s gate:no-direct-writes"
log "  pnpm -s gate:no-inline-styles"
log "  pnpm -s gate:write-gateway-enforcement"
log "  pnpm -s gate:tenant-scoping"
log "  pnpm -s gate:npmrc-policy
pnpm -s gate:governance-100"
log ""
log "Also run intrusion pack:"
log "  ./scripts/security/zt-intrusion-tests.sh"
log ""
log "Cursor must update this report with:"
log "- What changed (files)"
log "- Proof outputs (rg/gates) truncated"
log "- Residual risks if any"
log ""
log "---"
log "END OF CURSOR PLAN"

echo "WROTE PLAN -> $REPORT"
