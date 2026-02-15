# Data Retention Playbook

## Goal
Enforce retention policies while respecting legal holds.

## Steps
1. Verify policies in SSOT.
2. Run `node scripts/maintenance/run-retention.mjs`.
3. Review `runtime/reports/RETENTION_REPORT_*.md`.
4. Confirm audit entries in `governance/audit_ledger.json`.
