# RFC-2026-02-03-phase7-move1-tenant-onboarding-entitlements-billing-stub — RFC (Public copy)
## Summary
Introduce tenant onboarding SSOT port, default entitlements baseline, and billing hook stub behind ports.

## Goals
- Deterministic onboarding and entitlement baseline
- Contract tests prevent drift
- Billing integration boundary without external dependencies

## Non-Goals
- Persistence implementation
- Real billing provider calls

## Rollback
Revert the commit; contracts are additive.
