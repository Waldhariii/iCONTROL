# Platform API — Spec (Contract-first)

## Surfaces
- Control Plane API (admin)
- Client App API (tenant)

## Domains (initial)
- /auth/session
- /tenant/runtime (safe-mode, overrides)
- /entitlements
- /extensions
- /billing/usage
- /observability/health

## Contracts
- versioned schemas (append-only)
- strict error code taxonomy (ERR_*, WARN_*, OK, INFO)
- correlationId required for any write/side-effect
