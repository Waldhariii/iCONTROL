# PHASE C DONE

## Repro Commands
1. `pnpm install`
2. `node scripts/maintenance/generate-keys.mjs`
3. `node scripts/maintenance/generate-schemas-index.mjs`
4. `node scripts/ci/ci-all.mjs`

CI report output: `runtime/reports/CI_REPORT.md`

## Tests Added
- `scripts/ci/test-cp-strict.mjs`
- `scripts/ci/test-client-loader.mjs`
- `scripts/ci/test-client-render.mjs`
- `scripts/ci/test-client-surface-filter.mjs`
- `scripts/ci/test-entitlement-block.mjs`
- `scripts/ci/test-preview-isolation.mjs`
- `scripts/ci/test-active-release-stability.mjs`
- `scripts/ci/test-active-release-ssot.mjs`
- `scripts/ci/test-cp-down-client-works.mjs`
- `scripts/ci/test-token-gate.mjs`

## Active Release (SSOT)
Single source of truth: `platform/ssot/changes/active_release.json`.

- Backend `GET /api/runtime/active-release` reads this file.
- Backend `GET /api/runtime/manifest` uses `active_release_id` if no `release` query is provided.
- Studio activation updates this file via changeset ops (no direct writes).
- Preview never mutates `active_release.json`.

## Proof
`node scripts/ci/ci-all.mjs` completes with PASS (negative gate fixtures intentionally fail where expected) and writes report to `runtime/reports/CI_REPORT.md`.
