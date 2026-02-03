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

## RFC-2026-02-02-move6-critical-path-proof-pack-v1 — Critical Path Proof Pack v1 (Ports + CP Enforcement)

- Date: 2026-02-02
- Scope: app/src/core/ports (barrel index + CP enforcement wiring/bootstrap/facades) + reason-codes registry
- Motif business / plateforme:
  - Stabiliser le "contract surface" des ports (API interne) pour réduire le churn et sécuriser les intégrations CP/APP.
  - Verrouiller la posture boundary-safe (zéro import direct core-kernel depuis la couche app wiring).
  - Ajouter une couche de preuves automatisées (tests contract) pour rendre la gouvernance prédictive et industrialisable.
- Décision:
  - Ajout test freeze exports: `ports-public-surface.freeze.contract.test.ts`
  - Ajout test boundary scan: `cp-enforcement.boundary-scan.contract.test.ts`
  - Ajout test sanity reason codes: `reason-codes.registry.sanity.contract.test.ts`
- Règle de changement:
  - Toute modification des exports ports => mise à jour explicite de la liste EXPECTED + justification RFC.

## RFC-2026-02-02-move7-critical-path-harden-v1 — Critical Path Harden v1 (CP enable/deny ULTRA proofs)

- Date: 2026-02-02
- Scope: CP enforcement bootstrap + ports surface + tenant matrix invariants
- Motif business / plateforme:
  - Verrouiller le chemin critique (enable/deny) avec un test e2e unique, ultra-signal.
  - Garantir que chaque décision expose un reason code figé (REASON_CODES_V1) et reste traçable via correlationId.
  - Renforcer la conformité multi-tenant (TENANT_FEATURE_MATRIX invariants) sans dépendances cross-boundary.
- Décision:
  - Ajout: `cp-enforcement-critical-path.ultra.e2e.contract.test.ts`
  - Ajout: `tenant-matrix.enforcement.invariants.contract.test.ts`
  - Ajout: `cp-enforcement.boundary-scan.ultra.contract.test.ts`

## RFC-2026-02-02-move8-cp-surface-rollout-users-v1 — Move8 CP surface rollout (cp.users) v1

- Date: 2026-02-02
- Scope: consume CP enforcement ports on a real CP surface (users) with contract tests + reason-codes freeze.
- Motif business / plateforme:
  - Passage proof-pack -> production consumption.
  - Réduction du risque d'accès non-governed sur surfaces sensibles.
  - Stabilité contractuelle (ports + reason codes) observable via tests.

## RFC-2026-02-02-move9-runtime-identity-redirect-governed-v1 — Move9 Runtime identity SSOT + governed redirect v1

- Date: 2026-02-02
- Scope: centraliser tenantId/actorId resolution + redirection dans un choke-point gouverné (no scattered location.hash).
- Motif business / plateforme:
  - Réduction du risque d'incohérence multi-tenant (identity SSOT).
  - Observabilité et évolution contrôlée (redirect strategy swappable).
  - Stabilisation de l’enforcement sur surfaces CP sans hacks.

## RFC-2026-02-02-move9-governed-redirect-no-raw-hash-hotfix — Governed redirect compliance hotfix

- Date: 2026-02-02
- Scope: `app/src/core/runtime/governedRedirect.ts`
- Motivation: remove direct `window.location.hash` write to satisfy governance gate (`no-direct-location-hash`) while keeping redirect behavior centralized.
- Decision: same-surface redirects now use `window.location.assign(...)` from the governed redirect choke-point.

## RFC-2026-02-02-move10-redirect-strategy-v2-compliant-v1 — Move10 Redirect Strategy v2 (policy-compliant)

- Date: 2026-02-02
- Scope: suppression totale des writes directs ; redirection via RedirectAdapter unique.
- Motif business / plateforme:
  - conformité aux gates (no direct location.hash writes outside platform),
  - évolution contrôlée (router/telemetry swap),
  - réduction du risque de régression cross-surface.

## RFC-2026-02-02-move11-runtime-identity-ssot-v1 — Move11 Runtime Identity SSOT (tenant/actor session-bound)

- Date: 2026-02-02
- Scope: ajout du port RuntimeIdentityPort + impl strict (no implicit fallback prod).
- Motif business / plateforme:
  - stabiliser tenant/actor comme SSOT runtime (pré-requis multi-tenant),
  - réduire les accès implicites (bugs/privilege confusion),
  - faciliter audit/provenance et hardening CP.

## RFC-2026-02-02-move12-cp-surface2-entitlements-rollout-v1 — Move12 CP Surface Rollout #2 (entitlements/settings) via ports-only enforcement

- Date: 2026-02-02
- Scope: ajout wrapper enforcement surface entitlements + test e2e contract + patch page CP cible (non-invasive).
- Motif business / plateforme:
  - étendre l’enforcement contract-first au-delà de cp.users,
  - garantir la cohérence runtime identity + redirect v2 + reason codes gelés,
  - réduire le risque de drift (pages “dumb”, enforcement centralisé).

## RFC-2026-02-02-move12-entitlements-rollout-fix-v1 — Move12 integration fix (ports binding + reason code registry)

- Date: 2026-02-02
- Scope: `app/src/core/ports/cpSurfaceEnforcement.entitlements.ts`, `app/src/surfaces/cp/settings/Page.tsx`, `app/src/core/ports/reasonCodes.v1.ts`.
- Motivation: fix runtime binding mismatch (`bindCpEnforcement` unavailable), correct CP settings import path, and register `ERR_RUNTIME_IDENTITY_UNAVAILABLE` in frozen reason codes.

## RFC-2026-02-02-move13-tenant-matrix-enforcement-v1 — Move13 Tenant Matrix Enforcement (pages + capabilities) for CP surfaces

- Date: 2026-02-02
- Scope:
  - Ajout helper ports-only enforceTenantMatrix (SSOT)
  - Reason codes: ERR_PAGE_DISABLED, ERR_CAPABILITY_DISABLED (freeze-safe)
  - Wiring: cp entitlements surface enforcement passe par tenant matrix avant policy evaluate
  - Tests: e2e contract tenant-matrix enforcement
- Motif business / plateforme:
  - Standardiser l’activation/désactivation de surfaces par tenant (industrialisation)
  - Réduire le risque de régression et de logique “inline” dans les pages

## RFC-2026-02-02-move13-tenant-matrix-enforcement-fix-v1 — Build/runtime fix for Move13

- Date: 2026-02-02
- Scope: `app/src/core/ports/reasonCodes.v1.ts`, `app/src/core/ports/tenantMatrix.enforcement.ts`, `app/src/core/ports/cpSurfaceEnforcement.entitlements.ts`.
- Fixes:
  - Correct malformed reason-code literals introduced by scripted insertion.
  - Use existing tenant-matrix loader API (`getEnabledCapabilitiesForPlan`, `getEnabledPagesForPlan`).
  - Enforce identity guard before tenant-matrix check to keep strict runtime typing and deterministic behavior.

## RFC-2026-02-02-move14-cp-guard-centralize-rollout-users-v1 — Move14 CP guard centralization + cp.users rollout via tenant matrix

- Date: 2026-02-02
- Scope:
  - Ajout cpSurfaceGuard (single entry enforcement) pour surfaces CP
  - Rollout cp.users vers guardCpSurface (tenant matrix pages/capabilities)
  - Tests contract: guard stable + deny on missing identity
- Motif business / plateforme:
  - Réduire le coût marginal d’onboarding d’une nouvelle surface CP (config SSOT → enforcement)
  - Renforcer la gouvernance: “no inline enforcement” dans les pages

## RFC-2026-02-02-move15-cp-surface-registry-ssot-v1 — Move15 CP surface registry SSOT (surfaceKey -> capability) + registry-driven guard

- Date: 2026-02-02
- Scope:
  - Ajout cpSurfaceRegistry (SSOT surfaces CP + requiredCapability)
  - cpSurfaceGuard consomme le registry (plus de regles hardcodees dans pages)
  - Migration cp.users/cp.settings/cp.entitlements vers guard base registry
  - Tests contract: freeze keys + guard registry consumption
- Motif business / plateforme:
  - Standardiser l'enforcement CP via un catalogue central -> onboarding accelere + auditabilite

## RFC-2026-02-02-phase3-completion-pack-v1 — Phase3 completion pack (registry coverage + registry-only CP pages + ultra proofs)

- Date: 2026-02-02
- Scope:
  - Etend le registry SSOT pour couvrir toutes les surfaces CP presentes (cp/*)
  - Interdit requiredCapability inline dans les Pages CP (registry is source of truth)
  - Ajoute preuves ULTRA: freeze registry keys + scan contract
- Motif business / plateforme:
  - Reduit le risque operationnel et standardise l'onboarding de nouvelles surfaces CP via un catalogue unique.

## RFC-2026-02-02-phase4-ssot-routes-manifests-v1 — Phase 4 SSOT Routes + Manifests (V1)
- Motif business / plateforme: industrialiser l’expansion (routes + modules) avec un SSOT explicite, gates, et contrats stables.
- Changements: ajoute ROUTE_CATALOG_V1 + gates (route-catalog, module-manifests.v1) + warn-only entitlements scatter evidence.
- Risque: faible (gates shape-only + warn-only), bénéfice: contrôle et prédictibilité du delivery.

## RFC-2026-02-02-phase5-vfs-snapshots-rollback-v1 — Phase 5 VFS + Snapshots/Rollback (V1)
- Motif business / plateforme: rendre le storage multi-tenant governable via namespaces + snapshot/rollback contract-first.
- Changements: ajoute VfsPort + SnapshotPort, ports facades/binders, gate:vfs-namespaces, e2e rollback contract.
- Risque: faible (tests + gate strict), bénéfice: isolation tenant + opérations de rollback prédictibles.

## RFC-2026-02-02-phase5-1-app-local-contracts-boundary-fix-v1 — Phase5.1 Boundary Hotfix (APP-local VFS/Snapshot contracts)
- Motif business / plateforme: respecter le boundary map (aucun import app -> core-kernel) tout en conservant les ports VFS/Snapshot.
- Changements: duplication contrôlée des contracts en  + repoint facades/binders/providers/tests; ajout reason codes bind errors; mise à jour des freeze tests.
- Risque: faible; duplication explicitement documentée; gates/tests assurent la stabilité.

## RFC-20260202_215012-ports-index-explicit-exports-v2 — Ports index: explicit exports only (resolver v2)
- Date (UTC): 2026-02-02
- Motif plateforme: éliminer  pour stabiliser la surface publique (determinisme + freeze tests) et corriger la résolution des chemins avec suffixes non-TS (ex: *.facade).
- Scope: app/src/core/ports/index.ts (remplacement par exports explicites).
- Rollback: revert + tag-set-atomic.

## RFC-20260202_220249-ports-index-dedupe-tenantid — Ports index de-dup (TenantId canonical)
- Date (UTC): 2026-02-02
- Motif plateforme: garantir une surface d’export unique et build-stable (esbuild) en évitant les collisions (ex: TenantId ré-exporté par plusieurs facades/contracts).
- Décision: TenantId est exporté **une seule fois** via runtimeIdentity.contract (SSOT), retiré des autres re-exports.
- Scope: app/src/core/ports/index.ts.
- Rollback: revert + tag-set-atomic.

## RFC-20260202_220548-ports-freeze-expected-refresh — Ports public surface freeze EXPECTED refresh
- Date (UTC): 2026-02-02
- Motif plateforme: stabiliser la discipline d’exports publics (ports/index.ts) via un test freeze reflétant la surface réelle après passage en exports explicites.
- Décision: rafraîchir la liste EXPECTED (triée, dédupliquée) pour correspondre aux exports publics actuels.
- Scope: app/src/__tests__/ports-public-surface.freeze.contract.test.ts.

## RFC-20260202_220836-ports-freeze-expected-refresh — Ports public surface freeze EXPECTED refresh
- Date (UTC): 2026-02-02
- Motif plateforme: stabiliser la discipline d’exports publics (ports/index.ts) via un test freeze reflétant la surface réelle après passage en exports explicites.
- Décision: rafraîchir la liste EXPECTED (triée, dédupliquée) pour correspondre aux exports publics actuels.
- Scope: app/src/__tests__/ports-public-surface.freeze.contract.test.ts.

## RFC-2026-02-02-phase6-move1-module-catalog-ssot-v1 — Module Catalog SSOT v1 (MODULE_CATALOG + gate)
**Motif business / plateforme:** établir un inventaire SSOT des modules (manifest → capabilities/surfaces/routes) pour industrialiser l’onboarding, les entitlements et l’enforcement. Réduit les divergences et rend les gates prédictibles.
**Changements:** ajout de `config/ssot/MODULE_CATALOG.json`, gate `gate:module-catalog`, et test contract `module-catalog.contract`.
**Risques:** faible (ajout-only). Impact: verify:prod:fast inclut un gate additionnel.
**Rollout:** immédiat; maintenir tri/dedup deterministe.

## RFC-2026-02-02-phase6-move2-module-catalog-invariants — Phase6 Move2 (Module Catalog ULTRA invariants)
- Motivation: empêcher le drift silencieux entre MODULE_CATALOG SSOT et les manifest modules/*/manifest/module.json (contract-first, high-signal).
- Change: ajoute un test ULTRA invariants + un fichier d'exemptions contrôlé business (MODULE_CATALOG_EXEMPTIONS.json).
- Risk: faible (tests only) ; bénéfice: gouvernance renforcée (no silent module leakage).
- Gate impact: verify:prod:fast doit rester GREEN.

## RFC-2026-02-02-phase6-move3-catalog-driven-cp-surface-registry — Phase6 Move3 (Catalog-driven CP surface registry)
- Status: APPROVED
- Motivation: éliminer les listes hardcodées de surfaces CP; dériver surfaces/routes/capabilities depuis MODULE_CATALOG SSOT.
- Change: ajoute un builder ports-only (app boundary) + tests contract déterministes; wiring via accessor non-invasif.
- Risk: faible (additive). Rollback: retirer accessor + builder/test.

## RFC-2026-02-02-phase6-move3-module-catalog-cp-surfaces — Phase6 Move3 (MODULE_CATALOG includes CP surfaces)
- Status: APPROVED
- Motivation: débloquer la registry CP *catalog-driven* en garantissant des surfaces CP réelles dans MODULE_CATALOG SSOT.
- Change: regeneration logic excludes internal modules and injects CP surfaces from app/src/surfaces/cp/* into core-system.
- Risk: faible (SSOT only). Rollback: retirer l’injection synthetic + revenir au catalogue précédent.

## RFC-2026-02-02-phase6-move3-2-cp-nav-catalog-driven — Phase6 Move3.2 (CP navigation catalog-driven)
- Status: APPROVED
- Motivation: éliminer les listes hardcodées de surfaces CP et dériver menus/routes depuis SSOT (MODULE_CATALOG + registry catalog-driven).
- Change: ajout provider getCpNavCatalogDriven() + tests contract.
- Risk: faible. Rollback: revenir à nav statique (non recommandé).

## RFC-2026-02-03-phase6-move4-cp-nav-catalog-driven — Phase6 Move4 (CP nav catalog-driven; legacy lists deprecated)
- Status: APPROVED
- Motivation: supprimer la duplication (hardcoded nav arrays) et forcer la consommation SSOT via cpSurfaceRegistry.catalog-driven.
- Change: ajout provider getCpNavCatalogDriven() + tests contract.
- Risk: faible. Rollback: revenir à nav statique (non recommandé).

## RFC-2026-02-03-phase6-move5-forbid-hardcoded-cp-nav — Phase6 Move5 (fatal gate forbids hardcoded CP nav arrays)
- Status: APPROVED
- Motivation: prévenir la réintroduction de duplication/drift (listes cp.* hardcodées) après Move4 catalog-driven.
- Change: ajout gate:no-hardcoded-cp-nav (fatal) + wrappers legacy qui délèguent vers getCpNavCatalogDriven().
- Risk: moyen (peut casser du code legacy); mitigation: allowlist minimale + wrappers.
- Rollback: revert du gate + revert wrappers (non recommandé).

## RFC-2026-02-03-phase6-move6-arch-freeze-harden-tool-roots — Phase6 Move6 (arch-freeze hardening)
- Status: APPROVED
- Motivation: réduire le bruit des artefacts d'outils (Claude/Cursor/IDE/OS) tout en gardant un signal fort sur les nouveaux roots metier.
- Change: gate:architecture-freeze ajoute un IGNORE_ROOTS canonique au niveau gate (pas seulement .gitignore).
- Risk: faible (ignore uniquement des artefacts techniques connus); les nouveaux roots metier restent bloquants.
- Rollback: revert du commit Move6, puis tag-set-atomic.

## RFC-2026-02-03-phase6-move7-closeout-completion-pack — Phase6 Move7 (Closeout Completion Pack)
- Status: APPROVED
- Motivation: verrouiller l’operating model release-train + runbook canonique + artefacts de clôture Phase6.
- Change: ajout RUNBOOK_RELEASE_TRAIN.md + pack de clôture + trace RFC.
- Risk: faible (doc/process). Rollback: supprimer runbook/pack et garder le pipeline existant.
