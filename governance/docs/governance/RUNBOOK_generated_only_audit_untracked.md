# RUNBOOK — Generated-only artefacts (_audit) must remain untracked

## Objective
Keep local execution artefacts out of Git to preserve:
- deterministic builds
- repo hygiene
- governance gates integrity

## Policy
- `_audit/` is **generated-only**, local-only.
- Never `git add _audit/...`.
- `_audit/` must remain ignored by `.gitignore`.

## Enforcement
- Gate: `scripts/gates/gate-no-audit-tracking.sh`
- Contract test: `app/src/__tests__/gate-no-audit-tracking.contract.test.ts`

## Recovery (if accidentally tracked)
1. Remove from index (keep files locally):
   - `git rm -r --cached _audit/`
2. Ensure `.gitignore` contains `/_audit/`
3. Re-run: `npm test` + `npm run -s verify:prod:fast`
