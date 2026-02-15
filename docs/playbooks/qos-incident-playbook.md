# QoS Incident Playbook

## Triggers
- Rate limit spikes
- Circuit breaker open
- Queue depth saturation

## Steps
1. Identify tier and workload via `/api/qos/status`.
2. Inspect counters via `/api/qos/counters`.
3. If breaker open, wait for cooldown or reduce error rate.
4. Adjust plan/QoS policy via ChangeSet if needed.
5. Publish a release and monitor.

## Rollback
Revert the ChangeSet and roll back release if QoS change is too strict.
