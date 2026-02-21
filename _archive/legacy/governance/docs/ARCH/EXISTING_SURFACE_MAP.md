# EXISTING_SURFACE_MAP (Phase 0.5)

Generated: 2026-01-25
Scope: iCONTROL repo (read-only inventory)

## A) Write paths (DB / storage / events / index)

1) Local audit log (localStorage)
- Paths: `app/src/core/audit/auditLog.ts`
- Owner: core/audit
- Usage: append/read/clear audit events to tenant-namespaced localStorage key (`nsKey("auditLog.v1")`)
- Entrypoints: `appendAuditEvent()`, `writeAuditLog()`, `clearAuditLog()`
- Call graph (approx): UI/pages → `appendAuditEvent` → `writeAuditLog` → `localStorage.setItem`
- Risk: write path is local-only; SAFE_MODE blocks writes but no centralized Write Gateway; audit durability limited.

2) Entitlements storage (localStorage)
- Paths: `app/src/core/entitlements/storage.ts`, `app/src/core/entitlements/index.ts`
- Owner: core/entitlements
- Usage: load/save entitlements per tenant via `entitlementsKey(tenantId)`
- Entrypoints: `saveEntitlements()`, `clearEntitlements()`, `writeEntitlements()`
- Call graph (approx): UI/guards → `writeEntitlements` → `saveEntitlements` → `localStorage.setItem`
- Risk: write path bypasses Write Gateway (documented as future); SAFE_MODE blocks writes but no audit on save itself.

3) Runtime config cache (localStorage)
- Paths: `app/src/core/runtime/runtimeConfig.ts`
- Owner: core/runtime
- Usage: cache runtime-config fetched from `/app/api/runtime-config` or `/cp/api/runtime-config`
- Entrypoints: `resolveRuntimeConfig()` → `writeCached()`
- Call graph (approx): bootstrap → `resolveRuntimeConfig` → `fetch` → `writeCached` → `localStorage.setItem`
- Risk: write is local-only and uncoupled from Write Gateway; fallback written even on failure.

4) Tenant context (localStorage)
- Paths: `app/src/core/runtime/tenant.ts`
- Owner: core/runtime
- Usage: store tenant id (`icontrol.runtime.tenantId.v1`)
- Entrypoints: `setTenantId()`
- Call graph (approx): dev tooling → `setTenantId` → `localStorage.setItem`
- Risk: dev-only helper but still a write path; not governed by Write Gateway or audit.

5) Subscription persistence (filesystem)
- Paths: `modules/core-system/subscription/FileSubscriptionStore.node.ts`
- Owner: modules/core-system/subscription
- Usage: file-backed subscription store under `_DATA/subscriptions` (1 file per tenant)
- Entrypoints: `FileSubscriptionStore.upsert()`
- Call graph (approx): server/runtime → `SubscriptionService` → `SubscriptionStore.upsert` → `fs.writeFileSync`
- Risk: direct filesystem write, no centralized Write Gateway; location fixed to repo path.

6) Brand settings (localStorage)
- Usage: store brand override in localStorage
- Entrypoints: brand service write methods (localStorage.setItem/removeItem)
- Call graph (approx): UI settings → brandService → localStorage
- Risk: write path bypasses Write Gateway; unclear audit trail.

7) Control-plane local storage provider (stub)
- Paths: `app/src/core/control-plane/storage.ts`, `app/src/core/control-plane/services/tenantService.ts`, `app/src/core/control-plane/services/auditService.ts`
- Owner: core/control-plane
- Usage: stub LocalStorageProvider for tenant/audit services
- Entrypoints: LocalStorageProvider.get/set
- Risk: placeholder, not governed (no audit/Write Gateway).

8) UI demo data writes (localStorage)
- Owner: modules/core-system/ui
- Usage: create/update dossier demo data in localStorage
- Call graph (approx): UI actions → `writeAll` → `localStorage.setItem`
- Risk: write path in UI layer; SAFE_MODE checks are local-only; not centralized.

9) Auth session (localStorage)
- Paths: `platform-services/security/auth/localAuth.ts`
- Owner: platform-services/security
- Usage: store session in localStorage
- Entrypoints: `saveSession()`, `clearSession()`
- Risk: write path outside Write Gateway; requires audit if used in production.

## B) Audit surfaces (append/log/ledger)

1) Core audit log (localStorage)
- Paths: `app/src/core/audit/auditLog.ts`
- Usage: append/read/export/clear audit log (tenant-namespaced)
- Entrypoints: `appendAuditEvent()`, `readAuditLog()`, `exportAuditLogJson()`
- Risk: local-only; no persistence guarantee; SAFE_MODE blocks writes.

2) Audit emitter (standardized envelope + metrics)
- Paths: `app/src/policies/audit.emit.ts`, `app/src/policies/audit.redact.ts`, `app/src/policies/trace.context.ts`, `app/src/policies/metrics.registry.ts`
- Usage: normalize audit payload; redact; attach trace ids; emit metrics
- Entrypoints: `emitAudit()`
- Call graph (approx): policies → `emitAudit` → runtime audit emitter (if present)
- Risk: relies on runtime wiring; if no emitter, silent no-op.

3) Subscription audit trail (in-memory)
- Paths: `modules/core-system/subscription/AuditTrail.ts`, `modules/core-system/subscription/SubscriptionService.ts`
- Usage: record subscription resolution and provider sync attempts
- Entrypoints: `AuditTrail.record()`, `snapshot()`
- Risk: in-memory only unless persisted elsewhere; not unified with core audit log.

4) Cache audit snapshot
- Paths: `app/src/policies/cache.registry.ts`, `modules/core-system/ui/frontend-ts/pages/system/sections/cache-audit.ts`
- Usage: expose `__cacheAudit.snapshot()` for diagnostics; UI renders snapshot
- Risk: best-effort, no guarantee of centralized ledger.

## C) Policy (RBAC/ABAC/guards/middleware)

1) Runtime RBAC helper
- Paths: `app/src/runtime/rbac.ts`
- Usage: role checks for UI gating (settings/toolbox)
- Entrypoints: `getRole()`, `canAccessSettings()`, `canAccessToolbox()`
- Risk: separate from governance RBAC policy.

2) Governance RBAC policy + rules
- Paths: `app/src/core/governance/rbac/policy.ts`, `runtime/configs/permissions/rbac.json`
- Usage: role ranking and authorization; static RBAC rule set
- Entrypoints: `authorize()`, config rules
- Risk: multiple RBAC sources → drift risk.

3) Route catalog & guards
- Paths: `runtime/configs/ssot/ROUTE_CATALOG.json`, `app/src/core/ssot/routeCatalogLoader.ts`, `app/src/router.ts`
- Usage: allowed routes by surface; guard routes; fallback logic
- Entrypoints: router guard + allowlists
- Risk: duplicated allowlists in router + catalog; guardRouteAccess currently bypassed.

4) Page access guard (tenant matrix)
- Paths: `app/src/core/control-plane/guards/pageAccessGuard.ts`
- Usage: tenant plan route gating (currently disabled; returns allow)
- Risk: governance not enforced yet; explicit bypass in guard.

5) Feature flags governance
- Paths: `app/src/policies/feature_flags.runtime.ts`, `app/src/policies/feature_flags.governance.ts`, `app/src/policies/feature_flags.*`
- Usage: flags boot, audit governance meta (owner/expiry)
- Risk: audit-only; enforcement (forced OFF) occurs in control_plane runtime.

6) Version policy governance
- Paths: `app/src/policies/version_policy.*`, `app/src/router.ts`
- Usage: boot guard decisions; audit outcomes; SAFE_MODE forcing via policy
- Risk: policy enforcement in multiple locations; needs single policy engine.

## D) SAFE_MODE surfaces (fallbacks/circuit breakers/kill switches)

1) SAFE_MODE runtime flag
- Paths: `app/src/core/runtime/safeMode.ts`
- Usage: localStorage flag `icontrol.runtime.safeMode.v1`
- Entrypoints: `isSafeMode()`, `setSafeMode()`
- Risk: local-only; not tied to central policy engine.

2) SAFE_MODE signal + audit (audit-only)
- Paths: `app/src/policies/safe_mode.runtime.ts`
- Usage: publishes `__SAFE_MODE__` and audits signal
- Risk: audit-only; no enforcement by itself.

3) SAFE_MODE write enforcement
- Paths: `app/src/policies/safe_mode.enforce.runtime.ts`
- Usage: enforce write policy (SOFT/HARD) from `__SAFE_MODE__.enforcement`
- Risk: enforcement relies on runtime policy injection; not centralized into a Write Gateway yet.

4) SAFE_MODE write guard (audit-only)
- Paths: `app/src/policies/safe_mode.write_guards.runtime.ts`
- Usage: emits audit when write observed while safe_mode enabled
- Risk: audit-only; still no centralized block.

5) Circuit breaker / kill switches
- Paths: `app/src/policies/circuit.breaker.ts`, `app/src/policies/metrics.registry.ts`, `app/src/policies/cache.registry.ts`
- Usage: circuit breaker + metrics + cache kill-switches
- Risk: runtime-level policies not unified under SAFE_MODE engine.

## E) Contracts (API/Event/UI/Data)

1) SSOT route/tenant matrices (JSON contracts)
- Paths: `runtime/configs/ssot/ROUTE_CATALOG.json`, `runtime/configs/ssot/TENANT_FEATURE_MATRIX.json`, `runtime/configs/ssot/CAPABILITY_STATUS.json`
- Usage: routes, entitlements/plan gating, capability status
- Entrypoints: gates + loaders (routeCatalogLoader, tenantMatrixLoader)
- Risk: contract enforcement partially bypassed (pageAccessGuard disabled).

2) Studio blueprint schemas
- Paths: `app/src/core/studio/blueprints/schemas/*.schema.json`, `app/src/core/studio/blueprints/validate.ts`
- Usage: schema validation for studio runtime
- Risk: in-repo schema only; no registry for external consumers.

3) Runtime contracts (docs)
- Paths: `docs/contracts/runtime.md`
- Usage: describes RBAC requirements and SAFE_MODE policy
- Risk: doc-only; not enforced by a single policy engine.

## F) UI SSOT (tokens/themes/registries/gates)

1) Tokens SSOT
- Paths: `runtime/configs/ssot/design.tokens.json`, `app/src/styles/tokens.generated.css`
- Usage: tokens + presets + CSS vars mapping
- Risk: tokens include gradients in app preset; CP tokens are flat; dual systems exist.

2) Canonical CSS
- Paths: `app/src/styles/STYLE_ADMIN_FINAL.css`, `platform-services/ui-shell/layout/shell.css`
- Usage: CP canonical CSS; shell layout styles
- Risk: CSS vars and legacy vars coexist; ensure CP-only scope.

3) Theme manager (alternate token system)
- Paths: `app/src/core/ui/themeManager.ts`
- Usage: applies CSS vars for legacy theme system
- Risk: parallel theming system (potential drift vs SSOT tokens).

4) UI component registry + gates
- Paths: `app/src/core/ui/registry.ts`, `scripts/gates/gate-ui-component-registry.mjs`, `scripts/gates/gate-ui-contracts.mjs`, `scripts/gates/gate-ui-inline-drift.sh`
- Usage: SSOT registry and enforcement gates
- Risk: enforcement relies on gates; registry must stay updated.

## G) Entitlements / feature flags (resolution + sources)

1) Entitlements storage & resolution
- Paths: `app/src/core/entitlements/storage.ts`, `app/src/core/entitlements/resolve.ts`, `app/src/core/entitlements/requireEntitlement.ts`
- Usage: local entitlements per tenant; route enablement by plan; audit on missing entitlement
- Risk: local-only, not tied to centralized entitlement service.

2) Subscription-based entitlements (server-side)
- Paths: `modules/core-system/subscription/*.ts`, `app/src/core/subscription/*`
- Usage: resolve entitlements from subscription records; file-backed store
- Risk: separate read-model vs write-model; multiple sources.

3) Feature flags
- Paths: `app/src/policies/feature_flags.*`, `app/src/policies/control_plane.runtime.ts`, `modules/core-system/ui/frontend-ts/shared/featureFlags.ts`
- Usage: boot outcome + governance audit + UI flag helpers
- Risk: multiple sources of truth (runtime flags + UI shared flags).

## H) Gates / CI / hooks

- Local hooks: `.githooks/pre-commit`, `.githooks/pre-push`
- Gate scripts: `scripts/gates/*`, `scripts/audit/*`
- CI workflows: `.github/workflows/ssot-gates.yml`, `.github/workflows/ci-test.yml`, `.github/workflows/releaseops-gate.yml`
- NPM scripts: `package.json` (gate:ssot, gate:ui-contracts, gate:ui-inline-drift, etc.)
- Risk: gate coverage is strong for UI/SSOT; no single gate for Write Gateway enforcement yet.

