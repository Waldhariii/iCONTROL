#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# iCONTROL — Marketplace API Smoke Flow (curl)
# - tenant create (via Tenant Factory)
# - catalog browse
# - impact preview
# - install / enable / disable / uninstall (module + extension)
# - verify via manifest snapshot and installed list
#
# ROOT (repo): /Users/danygaudreault/iCONTROL
# Services expected:
#   pnpm api:dev        -> backend on :7070 (Write Gateway)
#   pnpm studio:dev     -> CP UI on :6060 (optional)
#   pnpm client:dev     -> client on its port (optional)
#
# Notes:
# - All writes are changeset-only and will be audited.
# - Many endpoints rely on x-tenant-id for tenant scoping.
# - Replace IDs below with real IDs from your SSOT/catalog.
# ============================================================

API_BASE="${API_BASE:-http://localhost:7070}"
ALLOW_REMOTE="${ALLOW_REMOTE:-0}"
ALLOW_TEMPLATE_MISMATCH="${ALLOW_TEMPLATE_MISMATCH:-0}"

if [[ ! "$API_BASE" =~ ^http://(localhost|127\.0\.0\.1)(:|/|$) ]]; then
  if [[ "$ALLOW_REMOTE" != "1" ]]; then
    echo "ERR: API_BASE must be localhost unless ALLOW_REMOTE=1"
    exit 2
  fi
fi

# Pick or create a tenant for the smoke run
TENANT_KEY="${TENANT_KEY:-smoke-tenant-$(date +%s)}"
TENANT_NAME="${TENANT_NAME:-Smoke Tenant $(date +%Y-%m-%dT%H:%M:%S)}"

# Pick a template that exists in your SSOT (Phase M)
TEMPLATE_ID="${TEMPLATE_ID:-tmpl:marketplace-free}"  # change to a real template id in platform/ssot/tenancy/tenant_templates.json

# Pick items that exist in your marketplace catalog (Phase P):
# - a module id (domain module) and an extension id
MODULE_ID="${MODULE_ID:-module:jobs}"            # change to a real module id
MODULE_VERSION="${MODULE_VERSION:-1.0.0}"        # or a concrete version
EXT_ID="${EXT_ID:-ext:sample}"                    # change to a real extension id
EXT_VERSION="${EXT_VERSION:-1.0.0}"              # or a concrete version

# Period for any finops/billing inspection (optional)
RANGE="${RANGE:-20260201-20260215}"

echo "============================================================"
echo "API_BASE=$API_BASE"
echo "TENANT_KEY=$TENANT_KEY"
echo "TEMPLATE_ID=$TEMPLATE_ID"
echo "MODULE_ID=$MODULE_ID (ver=$MODULE_VERSION)"
echo "EXT_ID=$EXT_ID (ver=$EXT_VERSION)"
echo "============================================================"

need() { command -v "$1" >/dev/null 2>&1 || { echo "ERR: missing '$1'"; exit 1; }; }
need curl
need python3

json() {
  python3 -c 'import json,sys; print(json.dumps(json.load(sys.stdin), indent=2, ensure_ascii=False))'
}

req() {
  local method="$1"; shift
  local url="$1"; shift
  echo >&2
  echo "---- $method $url" >&2
  curl -sS -X "$method" "$url" \
    -H "content-type: application/json" \
    "$@"
}

echo
echo "== 0) Health check / active release (optional) =="
req GET "$API_BASE/api/runtime/active-release" | json || true

echo
echo "== 1) Browse marketplace catalog =="
CAT_JSON="$(req GET "$API_BASE/api/marketplace/catalog")"
echo "$CAT_JSON" | json

echo
echo "== 2) Tenant Factory: PLAN =="
PLAN_JSON="$(req POST "$API_BASE/api/tenancy/factory/plan" \
  --data-binary "$(cat <<JSON
{
  "template_id": "$TEMPLATE_ID",
  "tenant_key": "$TENANT_KEY",
  "display_name": "$TENANT_NAME"
}
JSON
)")"
echo "$PLAN_JSON" | json

echo
echo "== 2.1) Break-glass (temporary) for tenant apply =="
req POST "$API_BASE/api/governance/break-glass/request" \
  --data-binary "$(cat <<JSON
{
  "reason": "marketplace smoke tenant apply",
  "scope": "platform:*",
  "allowed_actions": ["ops.tenancy.apply"]
}
JSON
)" | json

req POST "$API_BASE/api/governance/break-glass/approve" \
  --data-binary "$(cat <<JSON
{ "user_id": "user:admin" }
JSON
)" | json

req POST "$API_BASE/api/governance/break-glass/approve" \
  --data-binary "$(cat <<JSON
{ "user_id": "user:admin2" }
JSON
)" | json

echo
echo "== 3) Tenant Factory: APPLY =="
APPLY_JSON="$(req POST "$API_BASE/api/tenancy/factory/apply" \
  --data-binary "$(cat <<JSON
{
  "template_id": "$TEMPLATE_ID",
  "tenant_key": "$TENANT_KEY",
  "display_name": "$TENANT_NAME"
}
JSON
)")"
echo "$APPLY_JSON" | json

# Extract tenantId (required for the rest)
TENANT_ID="$(echo "$APPLY_JSON" | python3 -c 'import json,sys; o=json.load(sys.stdin); \
  [print(o[k]) or sys.exit(0) for k in ["tenant_id","tenantId"] if isinstance(o,dict) and k in o]; \
  [print(o[k2][kk]) or sys.exit(0) for k2 in ["data","result","payload"] if isinstance(o,dict) and k2 in o and isinstance(o[k2],dict) for kk in ["tenant_id","tenantId"] if kk in o[k2]]; \
  print("")')"
if [[ -z "${TENANT_ID}" ]]; then
  echo "ERR: Could not detect TENANT_ID from apply response. Set TENANT_ID env var and rerun."
  exit 1
fi
echo "TENANT_ID=$TENANT_ID"

echo
echo "== 3.1) Break-glass disable =="
req POST "$API_BASE/api/governance/break-glass/disable" | json

SCOPE_HDR=(-H "x-scope: platform:*")

echo
echo "== 3.2) Marketplace preflight =="
PREFLIGHT_JSON="$(req GET "$API_BASE/api/marketplace/tenants/$TENANT_ID/preflight" "${SCOPE_HDR[@]}")"
echo "$PREFLIGHT_JSON" | json
PLAN_TIER="$(echo "$PREFLIGHT_JSON" | python3 -c 'import json,sys; o=json.load(sys.stdin); print((o.get("plan_effective") or {}).get("tier",""))')"
RECOMMENDED_TMPL="$(echo "$PREFLIGHT_JSON" | python3 -c 'import json,sys; o=json.load(sys.stdin); print((o.get("recommendations") or {}).get("template_recommended",""))')"
if [[ "$PLAN_TIER" == "free" && -n "$RECOMMENDED_TMPL" && "$TEMPLATE_ID" != "$RECOMMENDED_TMPL" ]]; then
  echo "ERR: template mismatch for free plan. Recommended: $RECOMMENDED_TMPL, got: $TEMPLATE_ID"
  if [[ "$ALLOW_TEMPLATE_MISMATCH" != "1" ]]; then
    exit 2
  fi
fi

echo
echo "== 4) List tenant installed items (baseline) =="
req GET "$API_BASE/api/marketplace/tenants/$TENANT_ID/installed" \
  -H "x-tenant-id: $TENANT_ID" "${SCOPE_HDR[@]}" | json

echo
echo "== 5) Preview IMPACT (module) =="
req POST "$API_BASE/api/marketplace/tenants/$TENANT_ID/impact" \
  -H "x-tenant-id: $TENANT_ID" "${SCOPE_HDR[@]}" \
  --data-binary "$(cat <<JSON
{
  "type": "module",
  "id": "$MODULE_ID",
  "version": "$MODULE_VERSION",
  "reason": "smoke impact preview"
}
JSON
)" | json

echo
echo "== 6) INSTALL module (tenant scoped) =="
req POST "$API_BASE/api/marketplace/tenants/$TENANT_ID/install" \
  -H "x-tenant-id: $TENANT_ID" "${SCOPE_HDR[@]}" \
  --data-binary "$(cat <<JSON
{
  "type": "module",
  "id": "$MODULE_ID",
  "version": "$MODULE_VERSION",
  "reason": "smoke install module"
}
JSON
)" | json

echo
echo "== 7) ENABLE module =="
req POST "$API_BASE/api/marketplace/tenants/$TENANT_ID/enable" \
  -H "x-tenant-id: $TENANT_ID" "${SCOPE_HDR[@]}" \
  --data-binary "$(cat <<JSON
{
  "type": "module",
  "id": "$MODULE_ID",
  "reason": "smoke enable module"
}
JSON
)" | json

echo
echo "== 8) Verify manifest reflects module activation =="
req GET "$API_BASE/api/runtime/manifest" \
  -H "x-tenant-id: $TENANT_ID" | python3 -c 'import json,sys; m=json.load(sys.stdin); routes=m.get("routes",{}).get("routes",[]); nav=m.get("nav",{}).get("nav_specs",[]); pages=m.get("pages",{}).get("pages",[]); print("manifest_summary:"); print("  routes =", len(routes)); print("  nav    =", len(nav)); print("  pages  =", len(pages)); paths=[]; [paths.append(r.get("path")) for r in routes if r.get("path") and ((r.get("surface") or "") in ["client","app"] or r.get("path").startswith("/"))]; paths=sorted(set(paths))[:20]; print("  sample_paths =", paths)'

echo
echo "== 9) Preview IMPACT (disable module) =="
req POST "$API_BASE/api/marketplace/tenants/$TENANT_ID/impact" \
  -H "x-tenant-id: $TENANT_ID" "${SCOPE_HDR[@]}" \
  --data-binary "$(cat <<JSON
{
  "type": "module",
  "id": "$MODULE_ID",
  "action": "disable"
}
JSON
)" | json || true

echo
echo "== 10) DISABLE module =="
req POST "$API_BASE/api/marketplace/tenants/$TENANT_ID/disable" \
  -H "x-tenant-id: $TENANT_ID" "${SCOPE_HDR[@]}" \
  --data-binary "$(cat <<JSON
{
  "type": "module",
  "id": "$MODULE_ID",
  "reason": "smoke disable module"
}
JSON
)" | json

echo
echo "== 11) UNINSTALL module =="
req POST "$API_BASE/api/marketplace/tenants/$TENANT_ID/uninstall" \
  -H "x-tenant-id: $TENANT_ID" "${SCOPE_HDR[@]}" \
  --data-binary "$(cat <<JSON
{
  "type": "module",
  "id": "$MODULE_ID",
  "reason": "smoke uninstall module"
}
JSON
)" | json

echo
echo "== 12) EXTENSION flow (install/enable/disable/uninstall) =="
echo "-- 12.1) Preview IMPACT (extension) --"
req POST "$API_BASE/api/marketplace/tenants/$TENANT_ID/impact" \
  -H "x-tenant-id: $TENANT_ID" "${SCOPE_HDR[@]}" \
  --data-binary "$(cat <<JSON
{
  "type": "extension",
  "id": "$EXT_ID",
  "version": "$EXT_VERSION"
}
JSON
)" | json || true

echo "-- 12.2) Install extension --"
req POST "$API_BASE/api/marketplace/tenants/$TENANT_ID/install" \
  -H "x-tenant-id: $TENANT_ID" "${SCOPE_HDR[@]}" \
  --data-binary "$(cat <<JSON
{
  "type": "extension",
  "id": "$EXT_ID",
  "version": "$EXT_VERSION",
  "reason": "smoke install extension"
}
JSON
)" | json

echo "-- 12.3) Enable extension --"
req POST "$API_BASE/api/marketplace/tenants/$TENANT_ID/enable" \
  -H "x-tenant-id: $TENANT_ID" "${SCOPE_HDR[@]}" \
  --data-binary "$(cat <<JSON
{
  "type": "extension",
  "id": "$EXT_ID",
  "reason": "smoke enable extension"
}
JSON
)" | json

echo "-- 12.4) Disable extension --"
req POST "$API_BASE/api/marketplace/tenants/$TENANT_ID/disable" \
  -H "x-tenant-id: $TENANT_ID" "${SCOPE_HDR[@]}" \
  --data-binary "$(cat <<JSON
{
  "type": "extension",
  "id": "$EXT_ID",
  "reason": "smoke disable extension"
}
JSON
)" | json

echo "-- 12.5) Uninstall extension --"
req POST "$API_BASE/api/marketplace/tenants/$TENANT_ID/uninstall" \
  -H "x-tenant-id: $TENANT_ID" "${SCOPE_HDR[@]}" \
  --data-binary "$(cat <<JSON
{
  "type": "extension",
  "id": "$EXT_ID",
  "reason": "smoke uninstall extension"
}
JSON
)" | json

echo
echo "== 13) Final installed list =="
req GET "$API_BASE/api/marketplace/tenants/$TENANT_ID/installed" \
  -H "x-tenant-id: $TENANT_ID" "${SCOPE_HDR[@]}" | json

echo
echo "== 14) Locate impact reports (filesystem) =="
echo "Expected impact reports under: $PWD/runtime/reports/"
echo "Examples:"
echo "  runtime/reports/MARKETPLACE_IMPACT_*.md"
echo "  runtime/reports/CI_REPORT.md"
echo "  runtime/reports/DEMO_REPORT_*.md"
if [[ -f "./CI_REPORT.md" ]]; then
  echo "ERR: CI_REPORT.md must not exist at repo root"
  exit 2
fi

echo
echo "DONE."
