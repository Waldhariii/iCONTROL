#!/usr/bin/env bash
set -euo pipefail

# Replace "fallback placeholder: harness not wired yet" logs with a consistent warning marker.
# This is intentionally non-breaking: still exits 0, but emits WARN marker and writes proof json.

OUT="proofs/PROOFS_ROUTE_CHECK_WARNINGS.json"
mkdir -p proofs
TS="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

# Gather all scripts/check-*-route.js
FILES="$(ls -1 scripts/check-*-route.js 2>/dev/null || true)"

WARN_COUNT=0
for f in $FILES; do
  if rg -n 'fallback placeholder: harness not wired yet' "$f" >/dev/null 2>&1; then
    perl -0777 -i -pe 's/fallback placeholder: harness not wired yet/harness not wired yet (WARN_ONLY)/g' "$f"
    WARN_COUNT=$((WARN_COUNT+1))
    echo "[OK] patched $f"
  fi
done

cat > "$OUT" <<JSON
{
  "kind": "ICONTROL_ROUTE_CHECK_WARNINGS_PROOF_V1",
  "ts": "$TS",
  "patched_files_count": $WARN_COUNT,
  "note": "Route-check scripts may still be placeholders. Wording normalized to WARN_ONLY for observability without breaking CI."
}
JSON

echo "[OK] wrote $OUT"
