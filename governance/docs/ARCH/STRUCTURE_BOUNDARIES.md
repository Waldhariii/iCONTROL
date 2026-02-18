# iCONTROL — Structure Boundaries (SSOT)

## Objective
Reduce human error and architectural drift by making folder responsibilities explicit.

## Canonical runtime kernel (active)
- `app/src/platform/**` = **primary runtime kernel** (policyEngine, writeGateway, VFS, entitlements, runtimeConfig, observability)
- `app/src/surfaces/**` = **isolated surfaces** (APP + CP baseline pages)

## Domain / legacy application layer
- `app/src/core/**` = domain/business legacy layer (to be progressively aligned with platform kernel)

## Non-canonical / parallel kernels (legacy / to converge)
- `core-kernel/**` = abstract kernel (exists, but not to be imported by browser runtime without explicit ADR)
- `platform-services/**` = platform service layer (exists, but avoid new dependencies without ADR)

## Runtime loaders / naming collision
- `runtime/**` (root) vs `app/src/runtime/**` = naming collision risk.
Decision: until ADR, new code must prefer `app/src/runtime/**` and avoid importing root `runtime/**` from browser runtime.

## Multi-app boundaries
- `app/` = web frontend
- `server/` = server/runtime tools (Node)
- `app-desktop-client/`, `app-desktop-control/` = desktop wrappers (Tauri)
- `modules/` = functional modules (future entitlements gating)

## Temporary exception (tracked by gate allowlist)
- `app/src/main.ts` may import `platform-services/**` temporarily to keep current build stable.
- No other `app/src/**` file may import `platform-services/**`.
- Target: converge required pieces into `app/src/platform/**` via ADR and remove this exception.
