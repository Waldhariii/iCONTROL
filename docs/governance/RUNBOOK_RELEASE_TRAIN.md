# RUNBOOK — Release Train (RC/PROD/BASE) — Deterministic Operating Model

## Objective
Guarantee a stable, repeatable release-train alignment:
- main == origin/main
- RC_TAG == PROD_TAG == BASE_TAG == HEAD
- Governance gates are GREEN in the canonical order

## Canonical Order (must be respected)
1) Ensure clean tree:
   - git status -sb (must be clean)
2) Run validation:
   - npm run -s verify:prod:fast
   - npm test
   - npm run -s gate:tag-integrity
   - npm run -s gate:preflight:prod
3) If any change is needed:
   - apply minimal patch
   - commit atomically (single responsibility)
4) Align release train:
   - git push origin main
   - bash ./scripts/release/tag-set-atomic.sh
   - git push origin <RC_TAG> <PROD_TAG> <BASE_TAG> --force
5) Re-run final gates in same canonical order:
   - npm run -s verify:prod:fast
   - npm test
   - npm run -s gate:tag-integrity
   - npm run -s gate:preflight:prod

## Notes
- "ERR_TAG_INTEGRITY" is expected during pre-align checks after a new commit exists locally but tags are not moved yet.
- After alignment, tag-integrity MUST be green.
- Any new gate must include:
  - deterministic output
  - contract test (where applicable)
  - RFC entry + approval evidence if it impacts freeze rules

