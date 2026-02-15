# Mitigation Runbooks Playbook

## Principles
- Always dry-run before apply.
- Critical actions require quorum unless break-glass is active.
- Actions are built-in only; no arbitrary scripts.

## Execution
1. Create incident (manufacturer scope).
2. Execute runbook in dry-run mode.
3. If approved, apply runbook with quorum.
4. Verify effects via audit/timeline.

## Allowed Actions
- qos.throttle
- qos.shed
- release.rollback
- extension.killswitch
- change.freeze
- integration.disable
- open.break_glass
- close.break_glass

## Evidence
- Ensure evidence pack contains incident and timeline entries.
