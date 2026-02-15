# Bootstrap Playbook

Purpose: one-command proof of platform readiness (CI → evidence → release pack → air-gap verify → DR drill).

Commands:
```bash
node scripts/maintenance/bootstrap.mjs
```

CI-safe (no install, no CI recursion):
```bash
node scripts/maintenance/bootstrap.mjs --ci-safe
```

Expected outputs:
- `runtime/reports/BOOTSTRAP_SUMMARY_*.md`
- `runtime/reports/CI_REPORT.md`
- `runtime/reports/RELEASE_PACK_REPORT_*.md`
- `runtime/reports/DR_DRILL_PACK_*.md`
- `runtime/reports/AIRGAP_VERIFY_*.md`

Failure handling:
1. Read the summary report for failing step.
2. Re-run the failing step only.
3. Confirm no root artifacts are created.

Artifact budgets:
- Bootstrap runs a deep-clean dry-run before CI.
- If preview/snapshot counts exceed budgets, it auto-prunes using CAP_ONLY.
- Manual prune:
```bash
CAP_ONLY=1 KEEP_PREVIEW_COUNT=50 KEEP_SNAP_COUNT=150 APPLY=1 scripts/maintenance/deep-clean-v5.sh
```
