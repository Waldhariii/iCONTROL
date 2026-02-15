# Extensions Review Playbook

## Objective
Ensure extensions are safe and scoped before release and install.

## Steps
1. Verify requested capabilities (allowlist only).
2. Verify hooks map to built-in handlers.
3. Require quorum approvals for version release and install.
4. Compile and validate signatures.

## Rollback
Disable via kill switch or uninstall via ChangeSet.
