# RFC-2026-02-03-phase7-move2-onboarding-persist-vfs-snapshot — RFC (Public copy)
## Summary
Persist tenant onboarding records under VFS using Snapshot boundary for atomicity evolution.

## Storage layout
/ssot/tenants/<tenantKey>/tenant.json

## Rollback
Revert commit; keep in-memory facade as fallback.
