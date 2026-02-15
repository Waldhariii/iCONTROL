# Marketplace Incident Playbook

## Scope
Marketplace install/enable/disable failures and impact analysis discrepancies.

## Common Failures
1. Plan Gate failure (FREE vs PRO)
   - Action: verify tenant plan via `/api/marketplace/tenants/:id/preflight`.
   - Remediation: use `tmpl:marketplace-free` or upgrade plan to `plan:pro`.
2. Review Gate failure (extension)
   - Action: check `/api/marketplace/reviews?status=pending`.
   - Remediation: approve review, then retry install with version approved.
3. Latest-approved mismatch
   - Action: resolve version from preflight approved list.
   - Remediation: install with explicit approved version.

## Evidence
1. Locate impact report: `runtime/reports/MARKETPLACE_IMPACT_*.md`.
2. Check events index: `runtime/reports/index/marketplace_events.jsonl`.
3. Policy decision trace: `/api/observability/policy-decisions?tenant=<id>`.

## Escalation
If impact report indicates breaking changes, require quorum and rollback plan before proceeding.
