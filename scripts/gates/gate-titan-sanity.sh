#!/usr/bin/env bash
set -euo pipefail

need=(
  core-kernel/src/extensions/sandbox/sandbox.ts
  core-kernel/src/security/capabilities/policy.ts
  core-kernel/src/tenant/computeGovernor.ts
  platform-services/observability/tracing/trace.ts
  core-kernel/src/schema/migrationOrchestrator.ts
  platform-services/billing/pricingEngine.ts
  core-kernel/src/region/regionPolicy.ts
  platform-services/ai/orchestrator/orchestrator.ts
  platform-services/chaos/chaosPlan.ts
)
missing=0
for f in "${need[@]}"; do
  if [ ! -f "$f" ]; then
    echo "WARN_TITAN_MISSING: $f"
    missing=$((missing+1))
  fi
done
if [ "$missing" -gt 0 ]; then
  echo "WARN_TITAN_SANITY: missing=$missing"
fi
exit 0
