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


## RFC-2026-02-02-cp-bootstrap-enforcement — CP bootstrap enforcement integration (contract-first)

**Motif business / plateforme:** compléter la boucle *contract-first* en intégrant le bootstrap CP pour enregistrer les dépendances d’enforcement (ActivationRegistry + PolicyEngine) via *ports/facades* **dans la boundary app**, sans imports cross-boundary. Objectif: enforcement prédictible, stabilité, et conformité aux gates.

**Portée (fichiers / surfaces):**
- `app/src/core/ports/cpEnforcement.bootstrap.ts` (nouveau) — hook de bootstrap CP (guardé par `VITE_APP_KIND=CP`)
- `app/src/core/ports/cpEnforcement.wiring.ts` — wiring (DI) sans imports core-kernel
- `app/src/__tests__/cp-enforcement-enable-deny.e2e.contract.test.ts` — preuve e2e enable/deny
- `app/src/main.ts` — ajout call bootstrap (guardé)

**Gates / preuves:**
- `verify:prod:fast` doit rester **GREEN** (boundaries + root-clean + budgets).
- `npm test` doit rester **GREEN** (contrat e2e enable/deny).
- `gate:tag-integrity` + `gate:preflight:prod` doivent rester **GREEN**.

**Rollback / risques:**
- Changement isolé à la boundary app; rollback = revert commit(s) RFC + bootstrap.
- Aucun impact sur modules métier; aucun ajout de routes sauvages; aucun import module→module.

## RFC-2026-02-02-cp-bootstrap-facade-factories — Facade factories for CP bootstrap wiring

- Scope: `app/src/core/ports/activationRegistry.facade.ts`, `app/src/core/ports/policyEngine.facade.ts`
- Intent: provide explicit boundary-safe factory exports consumed by CP bootstrap integration.
- Compatibility: additive exports, no route changes.
- Governance: preserves no cross-boundary imports rule.

## RFC-2026-02-02-ssot-ports-index-v1 — SSOT Ports Index v1 (Contract-First Export Gate)

- Date: 2026-02-02
- Scope: app/src/core/ports/** (barrel index) + contract test for exported symbols
- Motivation (plateforme): réduire la dérive d’exports/imports et fiabiliser le wiring CP/APP via un point d’entrée unique.
- Gouvernance: aucun import cross-boundary ajouté; consommation des ports uniquement via un SSOT barrel.
- Risk: faible (refactor import paths). Mitigation: tests contract + gates verify:prod:fast.
- Notes: prépare le Move5 (enable/deny e2e) en stabilisant le “surface contract” des ports.


## RFC-2026-02-02-move5-reasoncodes-freeze-v1 — Reason Codes Freeze v1 (Enforcement Critical Path)

- Date: 2026-02-02
- Scope: enforcement layer (ports/bootstrap/write-gateway/contracts/policy surface)
- Motivation: verrouiller le vocabulaire des reason-codes pour stabiliser l'observabilité + l'audit + les contrats e2e.
- Decision:
  - Ajout de `app/src/core/ports/reasonCodes.v1.ts` comme SSOT.
  - Ajout d'un test contract `reason-codes.enforcement-freeze.contract.test.ts` qui échoue si un nouveau code apparaît sans mise à jour du registry + RFC.
- Guardrails:
  - Toute introduction d'un nouveau reason-code dans la surface scannée doit: (1) être ajoutée au registry, (2) être justifiée ici.

## RFC-2026-02-02-move5-reasoncodes-registry-quoting-fix — Fix reasonCodes.v1 literal quoting

- Date: 2026-02-02
- Scope: `app/src/core/ports/reasonCodes.v1.ts`
- Motivation: repair TS runtime failure caused by unquoted registry entries; restore enforcement path stability.
- Decision: registry values are frozen as string literals only.
