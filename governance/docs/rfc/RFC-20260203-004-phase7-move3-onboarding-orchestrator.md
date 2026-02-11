# RFC-2026-02-03-phase7-move3-onboarding-orchestrator — Tenant onboarding orchestrator (Phase7 Move3)

## Context
Nous voulons un flux onboarding déterministe, testable en Node, qui ne dépend pas de l’UI et respecte la gouvernance SSOT/SAFE_MODE.

## Proposal
Ajouter un orchestrateur ports-only qui exécute:
1) validate input
2) ensureTenant
3) apply default entitlements
4) billing hook (no-op safe)
5) snapshot commit/rollback best-effort

## Determinism
- aucune side-effect à l’import
- tests e2e contract Node-safe
- reason codes v1 alignés + tri déterministe

## Rollback
Retirer orchestrator contract/facade/tests si nécessaire (aucune migration).
