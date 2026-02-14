# Governance Model

## Scopes
- `platform:*`
- `tenant:<tenantId>:*`
- `surface:cp` / `surface:client`
- `release:<id>`
- `changeset:<id>`

## RBAC + ABAC
- Roles map to permission sets.
- Policies bind to roles with scopes.
- Allow requires: role permission + policy binding scope match + ABAC conditions (surface/env).

## Quorum
- Critical actions require approved review in `platform/ssot/changes/reviews/*`.
- Required approvals default to 2.

## Break-Glass
- Stored in `platform/ssot/governance/break_glass.json`.
- Must include `expires_at` and `allowed_actions`.
- Time-boxed, audited, and auto-disabled on expiry.
