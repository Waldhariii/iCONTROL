# Release Pack Import Playbook

## Staging Import
1. Identify pack directory.
2. Run:
   - `node scripts/maintenance/import-release-pack.mjs --pack <dir> --mode staging`
3. Review gates with staged manifests.

## Activation
1. Run:
   - `node scripts/maintenance/import-release-pack.mjs --pack <dir> --mode activate`
2. Activation updates `active_release.json` via changeset.

## Safety
- Fails if signature/checksums/compat checks fail.
- Pack activation only after gates PASS.
