# Domain Module Kit

## Purpose
The Domain Module Kit defines a manifest-driven contract for adding business modules (jobs, documents, billing) without CP UI changes. Modules are declarative SSOT objects compiled into the platform manifest and enforced by gates.

## Contract
- SSOT: `platform/ssot/modules/domain_modules.json`
- Versions: `platform/ssot/modules/domain_module_versions.json`
- Activations: `platform/ssot/modules/module_activations.json`
- Schema: `core/contracts/schemas/domain_module.schema.json`

Each module provides:
- pages, routes, nav, widgets, forms, workflows, datasources
- required capabilities and default entitlements
- dependencies limited to `platform:*` (no module-to-module imports)

## Activation
- Activation is tenant-scoped via `module_activations.json`.
- Platform compiler filters pages/routes/nav/widgets to active modules only.
- Client runtime also filters routes by module activation.

## Gates
- DomainIsolationGate: module refs must resolve and match module_id
- ModuleActivationGate: inactive modules must not appear in compiled routes/nav
- DataGovCoverageGate: classified fields required for module data models
- BudgetCoverageGate: per-tier budgets required for module datasources

## Runtime
Only manifest-signed module artifacts are routable. No fallback pages or routes exist outside active modules.
