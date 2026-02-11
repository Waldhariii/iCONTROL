#!/usr/bin/env zsh
set -euo pipefail

resolve_tracked() {
  # Deterministic tracked-file resolver (NO rg). Prefer git index; fallback rg --files.
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git ls-files -z | tr '\0' '\n'
  else
    rg --files
  fi
}



echo "=== AUDIT: P3 Subscription anti-coupling (UI/pages never import write-model; app runtime only via facade boundary) ==="

UI_SCOPE="modules/core-system/ui/frontend-ts/pages"
APP_SCOPE="apps/control-plane/src"
ALLOW_SCOPE="apps/control-plane/src/core/subscription"

DENY_PATTERNS=(
  "modules/core-system/subscription/SubscriptionRecord"
  "modules/core-system/subscription/SubscriptionStore"
  "modules/core-system/subscription/Provider"
  "modules/core-system/subscription/ProviderSync"
  "registryApi"
)

FOUND=0

# 1) UI/pages: zéro tolérance
for p in "${DENY_PATTERNS[@]}"; do
  if rg "$p" "$UI_SCOPE" -S >/dev/null 2>&1; then
    echo "BLOCKED: UI/pages references forbidden core subscription write-model/integration:"
    rg "$p" "$UI_SCOPE" -S || true
    FOUND=1
  fi
done

# 2) apps/control-plane/src runtime: interdit partout SAUF dans la boundary facade
# NOTE: exclusion glob must match full relative path under apps/control-plane/src
for p in "${DENY_PATTERNS[@]}"; do
  if rg "$p" "$APP_SCOPE" -S \
      --glob "!**/__tests__/**" \
      --glob "!**/core/subscription/**" \
      >/dev/null 2>&1; then
    echo "BLOCKED: apps/control-plane/src runtime references forbidden write-model/integration outside facade boundary:"
    rg "$p" "$APP_SCOPE" -S \
      --glob "!**/__tests__/**" \
      --glob "!**/core/subscription/**" \
      || true
    echo "Allowed boundary is: ${ALLOW_SCOPE}/**"
    FOUND=1
  fi
done

# 3) Guardrail (signal): UI/pages devraient consommer le facade
if ! rg "getEntitlementsForTenant" "$UI_SCOPE" -S >/dev/null 2>&1; then
  echo "WARN: UI/pages does not appear to consume entitlements facade yet (recommended next step)."
fi

if [ "$FOUND" -eq 1 ]; then
  exit 1
fi

echo "OK: anti-coupling audit PASS (facade boundary enforced)"
