# RFC — Core LTS Freeze (RFC-only)

## Objectif
Rendre le Core **ennuyeux** : stable, prévisible, rarement modifié.
Toute évolution du Core doit passer par une **RFC** (contrat explicite + risques + rollback).

## Périmètre Core (LTS)
Ce périmètre est gouverné et protégé par une gate CI/locale.

- core-kernel/**
- shared/**
- app/src/platform/**
- app/src/core/**
- scripts/release/**
- scripts/gates/**

> Note: on peut raffiner ce périmètre avec l’expérience, mais par défaut il est **strict**.

## Règle (NON NÉGOCIABLE)
Si un commit modifie un fichier du périmètre Core (LTS), alors il doit **aussi** modifier ce fichier RFC :
- docs/governance/RFC_CORE_CHANGES.md

Sinon : **BLOCK** (gate).

## Format d’une entrée RFC (copier-coller)
### RFC-YYYYMMDD-<slug>
- Owner:
- Motivation:
- Scope:
- API impact (contracts):
- Risks:
- Rollback plan:
- Migration steps:
- Evidence pack paths (_artifacts/...):
- Gate updates (if any):

### RFC-20260202-control-plane-policy-engine-v1
- Owner: platform
- Motivation: activate Control Plane feature toggles and centralize authorization decisions behind a PolicyEngine boundary.
- Scope: activation registry SSOT, policy engine v1 skeleton, cp activation gate, contract tests.
- API impact (contracts): introduces policy types/engine/rules contracts and app platform facade evaluatePolicy.
- Risks: deny-by-default behavior can block flows if actions are not explicitly covered.
- Rollback plan: revert commit `feat(cp+policy): activation registry + policy engine v1 (gates+contract tests)` and re-run tag-set-atomic.
- Migration steps: keep module actions mapped to `module.<ns>` convention; expand ruleset incrementally.
- Evidence pack paths (_artifacts/...): _artifacts/dist/** from preflight build + vitest outputs in CI logs.
- Gate updates (if any): adds `gate:control-plane-activation` into `verify:prod:fast`.

### RFC-20260202-event-backbone-v1
- Owner: @platform
- Motivation: Introduire une dorsale d'evenements contract-first (outbox + replay) dans le core.
- Scope: core-kernel/src/events/*, gate:event-backbone, tests de contrat.
- API impact (contracts): ajout de EventEnvelope/EventStore/EventBus (additif).
- Risks: derive contractuelle / replay non deterministe.
- Rollback plan: revert commit event-backbone + retag canonical.
- Migration steps: none (additif).
- Evidence pack paths (_artifacts/...): _artifacts/release/rc/rc-20260201_154033-r3/hardening/event-backbone/
- Gate updates (if any): gate:event-backbone ajoute a verify:prod:fast.

---

## RFC-2026-02-02-contract-first-ports-v1 — Contract-First Ports v1 (ActivationRegistry + PolicyEngine)

**Date (UTC):** 2026-02-02  
**Type:** Core contract surface addition (non-breaking)  
**Motif business / plateforme:** renforcer la boucle *contract-first* pour l’Activation Registry (enable/disable module par tenant) et le Policy Engine v1 (évaluation pure). Objectif: stabilité, isolation, et enforcement prédictible via ports/adapters, sans imports cross-boundary.

### Portée
- Ajout de contracts stables:
  - `core-kernel/src/contracts/activationRegistry.contract.ts`
  - `core-kernel/src/contracts/policyEngine.contract.ts`
- Ajout de tests de stabilité de contract dans le boundary core:
  - `core-kernel/src/__tests__/contract-first.activationRegistry.contract.test.ts`
  - `core-kernel/src/__tests__/contract-first.policyEngine.contract.test.ts`

### Compatibilité
- **Non-breaking**: ajout uniquement (aucune API existante modifiée).
- Aucun impact runtime immédiat: contracts consommés plus tard via adapters CP/runtime.

### Sécurité / Gouvernance
- Respect strict des boundaries: tests moved into `core-kernel` (aucun import direct `core-kernel` depuis `app/`).
- Zéro side effects: contracts type-first, tests compile-time conceptuels.

### Migration / Rollback
- Migration: none.
- Rollback: revert commit introduisant ces fichiers.


---

## RFC-2026-02-02-cp-enforcement-wiring-facades — CP Enforcement Wiring Facades (APP boundary-safe)

**Date (UTC):** 2026-02-02  
**Type:** Governance / wiring hardening (non-breaking)  
**Motif business / plateforme:** formaliser le *wiring* CP (enforcement) via facades/ports côté `app/` sans imports directs depuis `core-kernel/`, afin de garantir l’isolation (STRUCTURE_BOUNDARIES) et préparer l’intégration stricte Activation Registry + Policy Engine v1 via adapters.

### Portée
- Ajout de facades/ports APP (boundary-safe):
  - `app/src/core/ports/activationRegistry.facade.ts`
  - `app/src/core/ports/policyEngine.facade.ts`
- Ajout d’un module de wiring CP (facade binding, sans routes):
  - `app/src/core/ports/cpEnforcement.wiring.ts`
- Ajout d’un test e2e contract minimal (APP boundary):
  - `app/src/__tests__/cp-enforcement-wiring.e2e.contract.test.ts`

### Compatibilité
- **Non-breaking**: aucun changement de comportement production exigé; scaffolding + test.
- Aucun ajout de routes; aucune dépendance module→module; aucun import core-kernel dans app tests.

### Sécurité / Gouvernance
- Respect strict de `STRUCTURE_BOUNDARIES.md`.
- Prépare une étape suivante: remplacer le binding heuristique par des exports explicites et ajouter un test enable/deny de bout en bout via adapters existants.

### Migration / Rollback
- Migration: none.
- Rollback: revert commit(s) introduisant ces fichiers.

