# Extensions Registry — Spec (Canonical)

## Goal
Enable paid/optional blocks without breaking the free core.

## Requirements
- Extension manifests (id, version, capabilities, surfaces, routes, storage namespaces)
- Entitlements binding (tenant → enabled extensions)
- Sandbox execution constraints (capabilities + safe render)
- Deterministic routing registry (SSOT route catalog)
- Audit hooks: every extension action is traceable (correlationId + tenantId)

## No-go
- direct imports from extension → app/src
- runtime `eval`
- global side effects at import-time
