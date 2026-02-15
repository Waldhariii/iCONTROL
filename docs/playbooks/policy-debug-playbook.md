# Policy Debug Playbook

## Goal
Trace why an action was allowed or denied using correlation IDs.

## Steps
1. Capture `x-request-id` from API response.
2. Query policy decision trace:
   - `/api/observability/policy-decisions?tenant=<id>&since=<iso>`
3. Locate decision by `request_id` and review:
   - `decision` (allow/deny)
   - `reason_codes`
   - `policy_ids`

## Evidence Files
- `runtime/reports/policy/decisions.jsonl`
- `platform/ssot/governance/audit_ledger.json`

## Common Reasons
- `freeze` — change_freeze blocked mutation
- `permission_missing` — role lacks permission
- `policy_missing` — no matching policy binding
- `break_glass` — temporary override
