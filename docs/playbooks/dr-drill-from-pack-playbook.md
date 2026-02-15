# DR Drill From Pack Playbook

## Steps
1. Export pack (if not already).
2. Run drill:
   - `node scripts/maintenance/dr-drill-from-pack.mjs --pack <dir>`
3. Verify report under `runtime/reports/DR_DRILL_PACK_<ts>.md`.

## Checks
- Manifest loads
- Marketplace preflight
- QoS status
- Security secrets status (redacted)
