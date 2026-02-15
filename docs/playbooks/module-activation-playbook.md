# Module Activation Playbook

## Purpose
Activate or deactivate domain modules per tenant via SSOT changesets.

## Steps
1. Create a changeset with `module_activations` updates for the target tenant.
2. Compile preview manifest.
3. Run gates (DomainIsolation, ModuleActivation, DataGovCoverage, BudgetCoverage).
4. Publish release and activate for tenant (via entitlements/flags if needed).

## Rollback
- Roll back to previous release and restore prior module_activations snapshot.

## Notes
- Preview must never overwrite active release.
- Only active modules are routable in the client.
