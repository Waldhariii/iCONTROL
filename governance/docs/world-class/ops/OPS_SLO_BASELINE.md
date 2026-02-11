# Ops / SLO Baseline (Canonical)

## Core SLOs
- preflight:prod must be green before any push to main
- tag-integrity must be green always
- rollback simulation gate must pass
- budgets: no-raw-console=0; safe-mode-cp-only=0; pressure-layer=0; observability codes enforced

## Tenant Health KPIs
- error rate per tenant
- writeGateway rejection rate
- safe-mode toggle frequency
- storage failures / namespace collisions
- module load latency per surface

## Runbooks
- Tag drift remediation: tag-set-atomic
- Release evidence path: _artifacts/release/...
- Rollback: baseline/prod-candidate ancestry verification
