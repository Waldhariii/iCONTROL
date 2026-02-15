# QoS Engine

## Purpose
Protect the platform against noisy neighbors while preserving FREE usability.

## Inputs (SSOT)
- `platform/ssot/tenancy/plan_versions.json` (tiers, rate limits, budgets)
- `platform/ssot/qos/qos_policies.json` (breaker, shedding, queue limits)

## Runtime Behavior
The backend applies a **single QoS enforcer** for all requests:
- Rate limiting (token bucket) per tenant + workload
- Concurrency limits (semaphore) per tenant + workload
- Budget enforcement (requests/day, cpu_ms/day, cost_units/day)
- Circuit breaker on error rate
- Load shedding when queue depth exceeds policy
- Priority scheduling using `priority_weight`

## Determinism
Counters are stored by date partition in:
`platform/runtime/qos/counters/<tenant>/<YYYYMMDD>.json`

## Manifest
Compiled into `platform_manifest`:
- `qos_policies`
- `qos_runtime_config`

## Actions and Costs
Actions map to cost units:
- `api.read` = 1
- `api.write` = 3
- `ocr.page` = 5
- `workflow.step` = 1

## Gates
- QoS Config Gate
- Noisy Neighbor Gate
