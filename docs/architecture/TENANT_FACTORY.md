# Tenant Factory

## Purpose
Factory creates or clones tenants via changesets only. No direct SSOT writes outside patch engine.

## Flow
1. Plan (dry-run) -> report under runtime/reports.
2. Apply (changeset op tenant.create/tenant.clone).
3. Verify -> compile + gates.
4. Optional activation via entitlements/flags (no global active release change).

## SSOT Templates
- `tenancy/tenant_templates.json`
- `tenancy/tenant_template_versions.json`

## Guarantees
- Atomic changeset apply with snapshot.
- Audit entries for plan/apply/verify.
