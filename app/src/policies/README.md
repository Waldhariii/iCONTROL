# Policies — Governance (Kill-switchs & Contrats)

Ce dossier définit des *policies* transversales (comportements runtime) qui doivent rester **prévisibles**, **testables** et **ship-safe**.

## Kill-switchs (runtime-level, opt-out explicite)

### Principes
- **Scope**: le kill-switch vit sur `rt` (runtime object), jamais en variable globale.
- **Sémantique**: un kill-switch **désactive** un comportement, sans casser le flux fonctionnel.
- **Best-effort**: l’implémentation ne doit pas throw si `rt` est `null/undefined`.
- **Naming**: convention unique `rt.__SCOPE_BEHAVIOR_DISABLED__ === true`.

### Contrats supportés (baseline)
#### 1) Cache SWR (stale-while-revalidate)
- **Flag**: `rt.__CACHE_SWR_DISABLED__ === true`
- **Effet**: si l’entrée est expirée, **ne pas servir stale**; on **recompute** (synchronous path).
- **Objectif**: kill-switch de sécurité pour éviter un comportement “stale served” lors de troubleshooting.

#### 2) Cache LRU (eviction)
- **Flag**: `rt.__CACHE_LRU_DISABLED__ === true`
- **Effet**: désactive l’éviction LRU même si `maxEntries` est défini.
- **Objectif**: diagnostic (éviter eviction storms), et compatibilité provider externe.

#### 3) Metrics emission
- **Flag**: `rt.__METRICS_DISABLED__ === true`
- **Effet**: aucune écriture de compteurs/histogrammes via les entrypoints metrics (ex: `incCounter`, `observeHistogram`).
- **Objectif**: cut-off d’observabilité (perf/overhead) ou hard-disable lors d’incidents.

## Standards d’implémentation
- Le guard doit être **au plus près des entrypoints** (ex: exports de `metrics.registry.ts`) pour couvrir toutes les call paths.
- Les tests “contract” doivent couvrir:
  - le nom exact des flags
  - le comportement observable (pas seulement “flag présent”)
  - la non-régression (run dans gate standard)

## Références (tests contract)
- `app/src/__tests__/policies-killswitch.contract.test.ts`
