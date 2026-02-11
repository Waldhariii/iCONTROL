# iCONTROLapp — Artefacts Policy (Root Cleanroom)

## Rule
Repo root must remain clean and professional. No build outputs or transient logs at root.

## Forbidden at repo root (must not exist)
- `dist/`
- `dist_rollback*` (folders)
- `*.tgz` rollback packages
- `_AUDIT_*.log` / ad-hoc audit logs
- `.DS_Store`

## Allowed (examples)
- `_audit/` evidence logs produced by gates
- `_backups/` quarantine/backups (structured)
- `docs/` governance and ADR
- `scripts/` gates and tooling

## Enforcement
Gates will fail if forbidden artefacts are detected at root.
No automatic deletion will occur (fail-only).
