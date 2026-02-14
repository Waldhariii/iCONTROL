# Quota Throttling Playbook

## Goal
Prevent tenant overuse while keeping service stable. Billing is dormant.

## Signals
- `Quota exceeded` responses from the Write Gateway.
- `budget_alert` events in `governance/audit_ledger.json`.

## Actions
1. Verify tenant plan and quotas in SSOT.
2. Confirm usage in `platform/runtime/finops/usage/<tenant>/<YYYYMMDD>.json`.
3. If needed, update tenant quotas via ChangeSet (requires approvals).
4. Re-compile and publish a release if quota policy changes require manifest update.

## Rollback
If throttling is too strict, revert the quota update ChangeSet and publish a rollback release.
