# Billing Dormant Incident Playbook

## Expected Behavior
- Billing publish is blocked when `billing_mode.enabled=false` or scopes disallow publish.
- Provider webhooks are rejected when `billing_mode.scopes.provider_webhooks=false`.

## Validation Steps
1. GET `/api/billing/mode` and confirm `enabled=false`.
2. Attempt publish; expect `403 Billing dormant: publish blocked`.
3. Check policy decision trace:
   - `/api/observability/policy-decisions?tenant=<id>`

## Evidence
- Draft reports: `runtime/reports/BILLING_DRAFT_*.md`.
- Draft events index: `runtime/reports/index/billing_drafts.jsonl`.
- Audit ledger: `platform/ssot/governance/audit_ledger.json`.

## Escalation
Enabling billing requires quorum and explicit policy update; never enable in incident response without approvals.
