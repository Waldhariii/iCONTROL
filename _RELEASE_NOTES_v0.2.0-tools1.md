# v0.2.0-tools1 — ReleaseOps Tooling

## Scope
- ReleaseOps: add close-the-loop gate script
- Notes hygiene: normalized commit pointer formatting
- Release workflow hardening: tag integrity, dist leak check, gh release publish

## Gates
- TAG integrity (tag -> HEAD)
- npm test (app)
- audit-subscription-no-ui-coupling
- audit-no-node-builtins-in-app
- audit-no-node-builtins-in-client-surface
- npm run build (app)
- dist/assets: no FileSubscriptionStore* chunks

## Commit
- 04e3743
