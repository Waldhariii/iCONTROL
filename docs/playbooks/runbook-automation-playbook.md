# Runbook Automation Playbook

Run a runbook by id (dry-run default):
```bash
export S2S_CI_HMAC=dummy
node scripts/maintenance/run-runbook.mjs --runbook rb-promote-pack
```

Apply mode (requires quorum unless break-glass allows):
```bash
export S2S_CI_HMAC=dummy
node scripts/maintenance/run-runbook.mjs --runbook rb-rollback-last --apply
```

Outputs:
- `runtime/reports/RUNBOOK_<id>_*.md`
- `runtime/reports/index/runbook_runs.jsonl`
