# FinOps Model

## Scope
This platform uses **metering + quotas + budgets** from SSOT. Billing is dormant (no payment flows).

## SSOT Sources
- `platform/ssot/tenancy/plans.json`
- `platform/ssot/tenancy/plan_versions.json`
- `platform/ssot/tenancy/tenant_overrides.json`
- `platform/ssot/tenancy/tenant_quotas.json`
- `platform/ssot/finops/metering_catalog.json`
- `platform/ssot/finops/metering_versions.json`
- `platform/ssot/finops/rate_cards.json`
- `platform/ssot/finops/budgets.json`

## Runtime Manifest Fields
Compiled into `platform_manifest`:
- `plans`
- `plan_versions`
- `tenant_entitlements`
- `tenant_quotas`
- `metering_catalog`
- `budget_policies`

## Enforcement (DORMANT)
- Quotas are enforced in the Write Gateway per tenant.
- Usage is recorded under `platform/runtime/finops/usage/`.
- Budget thresholds create audit events but **no charges**.

## Default Plan
Tenants without explicit plan use the plan with `is_default=true` (FREE).

## Gates
- **Quota Gate**: quotas present, non-negative, monotonic (same major version).
- **Plan Integrity Gate**: tenant plan references exist; overrides do not exceed hard ceilings.
