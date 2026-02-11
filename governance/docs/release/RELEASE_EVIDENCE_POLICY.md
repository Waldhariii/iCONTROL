# Release Evidence Policy (SSOT)

## Allowed tracked evidence
Only the following path may be tracked:
- `_artifacts/release/rc/<RC_TAG>/**`

## Forbidden
Any tracked evidence outside the RC allowlist, e.g.:
- `_artifacts/release/prod/**`
- root-level `PROVENANCE_*.md`, `RELEASE_BUNDLE_*.json`, `RELEASE_INDEX.md`

## Workflow
1) Generate/collect evidence as needed (may be created at repo root temporarily).
2) Run: `bash scripts/release/attach-rc-evidence.sh`
3) Gate: `npm run -s gate:release-rc-artifacts` must pass.
