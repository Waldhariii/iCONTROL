# RFC-20260203-001-phase6-move5-forbid-hardcoded-cp-nav

Statut: APPROVED
Date: 2026-02-03

## Contexte
Les listes CP hardcodées dans la navigation créent du drift avec les sources SSOT.

## Décision
- Ajouter une gate fatale `gate:no-hardcoded-cp-nav`.
- Autoriser uniquement les points SSOT:
  - `app/src/core/nav/cpNav.catalog.ts`
  - `app/src/core/ports/cpSurfaceRegistry.catalog.ts`
- Convertir les modules legacy vers des wrappers déléguant au provider catalog-driven.

## Impact
- Empêche les régressions de duplication de surfaces CP.
- Rend la navigation CP strictement dérivée du catalog/registry.

## Rollback
Revert du commit Move5 puis réalignement release-train.
