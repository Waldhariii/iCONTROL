# Data Export Playbook

## Rules
- Exports require `data.export` permission.
- `pii.high` masked by default.
- Bulk export requires quorum.

## Steps
1. Submit export request via backend.
2. Verify masking output.
3. Audit entry recorded for request and result.
