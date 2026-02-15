# Migration Playbook

## Principles
- Declarative migrations only.
- Dry-run before apply.
- Breaking changes require quorum.

## Steps
1. Select migration IDs from plan.
2. Dry-run and review evidence.
3. Apply migration.
4. Verify with gates.
5. Rollback on failure.
