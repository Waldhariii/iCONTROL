# Ops Control Plane (No UI)

## Scope
- Manufacturer-only ops controls (no UI routes).
- Runbooks are declarative and manifest-driven.
- All actions are built-in only and audited.

## SSOT Objects
- `ops/runbooks.json` + `ops/runbook_versions.json`
- `ops/mitigation_policies.json` + `ops/mitigation_versions.json`
- `ops/incident_severities.json`

## Runtime Stores
- `runtime/ops/incidents/<incidentId>.json`
- `runtime/ops/timeline/<YYYYMMDD>.jsonl`

## Execution Flow
1. Create incident (manufacturer scope).
2. Execute runbook in dry-run.
3. Apply runbook (quorum required for critical actions unless break-glass active).
4. Actions update runtime/SSOT and append audit + timeline entries.

## Controls
- ABAC + policy bindings for ops.* actions.
- Quorum enforced for critical actions.
- Break-glass is time-boxed and allowlist only.

## Evidence Pack
- Includes incidents/timeline samples, change_freeze, break_glass, killswitch states, and rollbacks.
