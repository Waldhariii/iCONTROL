# Compatibility & Migration Model

## SemVer Policy
- MAJOR: breaking changes.
- MINOR: backward-compatible additions.
- PATCH: fixes only.

## SSOT Objects
- `compat/compatibility_matrix.json`
- `compat/compatibility_versions.json`
- `compat/deprecations.json`
- `compat/migrations.json`

## Upgrade Flow
1. Plan upgrade via compatibility matrix.
2. Dry-run to generate upgrade plan evidence.
3. Apply (quorum required for breaking upgrades).
4. Verify via compile + gates.
5. Rollback if verification fails.

## Deprecation
- Always deprecate before removal.
- Removals only on MAJOR.
