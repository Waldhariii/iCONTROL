# Upgrade Playbook

## Steps
1. Generate compatibility diff between releases.
2. Plan upgrade from matrix.
3. Dry-run migration plan (required).
4. Quorum approval for breaking changes.
5. Apply upgrade.
6. Verify via compile + gates + drift.
7. Rollback if verification fails.

## Evidence
- UPGRADE_PLAN report
- Compatibility diff report
