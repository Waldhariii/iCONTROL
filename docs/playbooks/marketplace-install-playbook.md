# Marketplace Install Playbook

## Flow
1. Select tenant and item (module/extension).
2. Run **Preview Impact** (generates `MARKETPLACE_IMPACT_*.md`).
3. Install/Enable:
   - Changeset created
   - Preview compile + gates
   - Release candidate compiled and signed
4. Activation:
   - Module activation (tenant-scoped)
   - Extension installation (tenant-scoped)

## Governance
- Quorum required for extension install.
- Module enable requires quorum only when impact is breaking.
- Break-glass cannot bypass manifest signature or governance.

## Rollback
Use standard release rollback. Disable/uninstall can be performed to remove routes/hooks.

