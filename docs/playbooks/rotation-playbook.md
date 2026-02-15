# Secret Rotation Playbook

## Dry-Run (default)
```bash
node scripts/maintenance/run-rotation.mjs --dry-run
```
- Generates `runtime/reports/ROTATION_REPORT_<ts>.md`.
- No SSOT changes applied.

## Apply (requires quorum or break-glass)
```bash
node scripts/maintenance/run-rotation.mjs --apply
```
Requirements:
- Break-glass active **or** quorum approvals recorded for rotation.
- Changeset applied atomically, preview compiled, gates executed.

## Verification
- Check `RotationIntegrityGate` PASS.
- Confirm new `active_ref` in `secret_bindings.json`.
- Validate `/api/security/secrets/status` health for bindings.
