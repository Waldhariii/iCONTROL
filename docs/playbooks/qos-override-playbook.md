# QoS Override Playbook

## Purpose
Apply temporary throttling or shedding for stability without breaking other tiers.

## Actions
1. Use Ops runbook to apply `qos.throttle` or `qos.shed`.
2. Confirm override expiry (duration-based) and scope.

## Verification
1. Check ops events:
   - `/api/ops/events?tenant=<id>`
2. Review override entries:
   - `runtime/ops/qos_overrides.json`
3. Validate QoS counters:
   - `/api/qos/counters?tenant=<id>&day=YYYYMMDD`

## Rollback
Overrides expire automatically. If immediate rollback is needed, re-apply with factor=1 or disable via runbook.
