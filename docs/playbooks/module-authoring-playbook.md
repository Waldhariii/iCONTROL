# Module Authoring Playbook

## Scope
Author a new domain module using SSOT only. No CP UI changes.

## Steps
1. Create module definition in `platform/ssot/modules/domain_modules.json`.
2. Add version in `platform/ssot/modules/domain_module_versions.json`.
3. Create SSOT entries for pages, routes, nav, widgets, forms, workflows, datasources.
4. Ensure all data fields have DataGov classifications.
5. Ensure all queries have budgets for every tier.
6. Compile and run gates.

## Checklist
- Dependencies only `platform:*`.
- All references resolve and match `module_id`.
- No hardcoded styles or secrets.
- Module is activated via `module_activations.json`.
