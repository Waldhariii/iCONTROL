# Control Plane Supremacy — Ultra Program

## Outcome
Le Control Plane est la source unique de vérité (SSOT) pour :
- tenants, entitlements, policies, budgets, pricing, regions
- promotion window, release train, drift controls
- invariants de sécurité (SAFE_MODE / RBAC / write governor)

## Interfaces (contract-first)
- core-kernel/src/policy/policyEngine.contract.ts
- platform-services/policy/policyEngine.impl.ts

## Non-negotiables
- Aucune logique métier qui fuit dans app/src (UI uniquement)
- Modules -> via interfaces contractuelles, jamais via imports transversaux
