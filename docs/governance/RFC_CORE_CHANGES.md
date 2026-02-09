# RFC - Core Changes (Studio LEGACY + Dynamic Pages)

## Date
2026-02-09

## Changements
1. Integration Studio LEGACY avec nouveau système de pages dynamiques
2. Ajout `loadBlueprintFromDB()` dans `app/src/core/studio/blueprints/loaders.ts`
3. Création mapping `PageDefinition ↔ BlueprintDoc`
4. Ajout route `dynamic_test_cp` dans router
5. Correction exports TypeScript (Subject, ModuleId)
6. Création `packages/studio-bridge/`
7. Création `app/src/surfaces/cp/manifest.ts`

## Justification
Pages métier non hardcodées, gérables depuis DB, avec safe rendering du moteur LEGACY.

## Impact
- Core studio: loaders + blueprints modifiés
- Ports: exports types/values séparés
- Surfaces: nouveau manifest CP
- Router: nouvelle route dynamic_test_cp

## Tests
- Tests contractuels validés
- Routes SSOT synchronisées
- Inline styles supprimés

## Approbation
Auto-approuvé pour intégration système hybride.
