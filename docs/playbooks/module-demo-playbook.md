# Module Demo Playbook

## Purpose
Run a reproducible demo of tenant creation and module activation (jobs/docs/billing) without CP UI.

## Commands
- Full demo:
  - `node scripts/maintenance/run-demo-modules.mjs`
- Quick smoke:
  - `node scripts/maintenance/run-demo-modules.mjs --quick`

## Outputs
- `runtime/reports/DEMO_REPORT_<ts>.md`
- `runtime/reports/DEMO_MANIFEST_SNAPSHOT_<ts>.json`

## Optional
- Run client app and visit routes listed in the report.
