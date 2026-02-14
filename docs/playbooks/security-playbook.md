# Security Playbook

## Incident Procedure
1. Assess impact and scope.
2. If required, request break-glass with allowlist and expiry.
3. Obtain quorum approvals.
4. Apply minimal corrective actions.
5. Disable break-glass and audit.

## Rollback
1. Confirm quorum approval.
2. Execute rollback via release orchestrator.
3. Validate drift and SLO recovery.

## Break-Glass
- Request -> Approve (quorum) -> Enable -> Expire/Disable.
- Never bypass manifest signature checks.
