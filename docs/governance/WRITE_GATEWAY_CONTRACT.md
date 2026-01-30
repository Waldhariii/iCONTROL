# WRITE_GATEWAY_CONTRACT

**Objectif:** Une seule façade pour les écritures (storage, config, toggles). Phase 5.2–5.3.  
**Généré:** 2026-01-24

## Principes

1. **Aucune écriture directe** vers localStorage, sessionStorage, IndexedDB ou endpoints de config en dehors du Gateway.
2. **Snapshot avant mutation** pour les cibles critiques (matrice tenant, config, manifests) — cf. SNAPSHOT_ROLLBACK_POLICY.
3. **Intégration SAFE_MODE** : si actif et mutation bloquée, le Gateway retourne une erreur contrôlée.
4. **Audit :** toute mutation enregistrée avec tenant, actor, action, target, before/after (résumé).

## Interface cible

- `write(req: WriteRequest): Promise<WriteResult>` avec `WriteRequest { target, key, value, tenantId?, options? }` et `WriteResult { ok, error?, snapshotId? }`.
- `rollback?(snapshotId): Promise<{ ok, error? }>` optionnel.

## Cibles

- **storage** : nsKey, entitlementsKey — snapshot selon politique.
- **config** : safe-mode, brand, module-registry — snapshot oui.
- **toggles** : feature flags, SAFE_MODE — snapshot oui.
- **tenant_matrix** : TENANT_FEATURE_MATRIX — snapshot oui.
- **entitlements** : saveEntitlements — snapshot selon politique.

## État

- **Non implémenté.** Les écritures se font encore via localStorage.setItem, saveEntitlements, etc. Livrable Phase 5.3.
