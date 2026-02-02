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
