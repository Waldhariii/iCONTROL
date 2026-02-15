# No-Secrets Gate Response Playbook

## When Gate Fails
1. Identify file and snippet in gate output.
2. Remove secret-like content immediately.
3. Re-run `node scripts/ci/ci-all.mjs`.

## Common Causes
- Accidentally logged tokens or key material.
- Reports or evidence packs containing raw values.
- Test fixtures with real-looking secrets.

## Remediation
- Replace values with `sec:ref:*` or redacted placeholders.
- Update tests to use dummy env vars without printing them.
- Re-generate evidence pack to confirm clean state.
