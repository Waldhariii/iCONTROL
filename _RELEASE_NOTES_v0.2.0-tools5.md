# v0.2.0-tools5 — ReleaseOps Tooling

## Scope
- (TODO) Describe scope succinctly (what changed, why it matters)

## Gates (expected GREEN)
- npm test (app)
- audit-subscription-no-ui-coupling
- audit-no-node-builtins-in-app
- audit-no-node-builtins-in-client-surface
- npm run build (app)
- dist/assets: no FileSubscriptionStore* chunks

## Risk / Follow-ups
- (TODO) Provider adapters isolated behind interface; enterprise_free fallback
- (TODO) Observability: structured logs + metrics around entitlements/registry

## Commit
- 445122d
