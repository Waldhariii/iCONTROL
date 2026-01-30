# SNAPSHOT_ROLLBACK_POLICY

**Objectif:** Quand et comment faire un snapshot avant mutation critique ; rollback testé. Phase 5.4–5.5.  
**Généré:** 2026-01-24

## Quand snapshot

- **Config :** safe-mode, brand, module-registry, rbac avant toute écriture.
- **Toggles :** feature flags, SAFE_MODE runtime.
- **Matrice tenant :** TENANT_FEATURE_MATRIX, enabled_pages / enabled_capabilities par tenant.

## Format

- **Contenu :** copie JSON de la cible avant mutation.
- **Métadonnées :** snapshotId, target, tenantId, at (ISO), actor.
- **Stockage :** espace dédié ou via Write Gateway.

## Rétention

- Conserver les N derniers snapshots par cible (ex. N=5) ; purger au-delà. Au moins 24 h pour config en prod.

## Rollback

- `rollback(snapshotId)` restaure l’état. Test à chaque release ou manuel. Rollback audité.

## État

- **Non implémenté.** À brancher dans le Write Gateway (Phase 5.3) et appliquer aux mutations Phase 5.5.
