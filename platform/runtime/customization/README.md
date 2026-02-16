# Tenant-safe customization layer

Enterprises customize without forking.

**Sources:** `ssot/tenancy/tenant_overrides.json` and optionally `ssot/tenant_overrides/` (per-tenant or per-capability overrides).

**Capabilities:**
- Theme override
- Workflow override
- Adapter policy override
- Extension activation override
- Quota override

**Governance:** All overrides MUST respect IsolationGate and DataGovCoverageGate. No override may bypass governance.

Outputs only under `runtime/`.
