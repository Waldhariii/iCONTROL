# Release Pack Export Playbook

## Steps
1. Ensure active release is set.
2. Run:
   - `node scripts/maintenance/generate-release-pack.mjs --release <id> --env <env>`
3. Verify:
   - `runtime/reports/packs/PACK_<ts>_<id>/pack.json`
   - `pack.sig` exists
   - no secrets in reports

## Notes
- Packs are stored under `runtime/reports/packs/`.
- No secrets are included; pack is redacted by design.
