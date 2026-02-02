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
