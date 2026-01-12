# v0.2.0-rc1 — Release Candidate

## Scope
- Subscription: dual-runtime store wiring (Node via import.meta.url; Browser store separate)
- Vite/Vitest compatibility: prevent Node store from leaking into client build graph
- Audits: client-surface scan excludes tests/specs; stable exit codes

## Gates (expected GREEN)
- npm test (app)
- audit-subscription-no-ui-coupling
- audit-no-node-builtins-in-app
- audit-no-node-builtins-in-client-surface
- npm run build (app)
- dist/assets: no FileSubscriptionStore* chunks

## Risk / Follow-ups
- Provider adapter (Stripe/others) to be isolated behind interface; keep enterprise_free fallback
- Observability: structured logs + metrics around entitlements/registry

## Commit
- 7829c98
