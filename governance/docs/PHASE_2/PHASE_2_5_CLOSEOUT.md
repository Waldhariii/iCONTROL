# PHASE 2.5 — CLOSEOUT (STORAGE shadow)

## Scope livré
Migration des surfaces STORAGE restantes via pattern canonical shadow:
- legacy-first (comportement inchangé)
- shadow gated (flag OFF par défaut)
- emit NO-OP (log-only), Node ESM natif, sans imports TypeScript

## Cibles migrées
- scripts/ui-preview.mjs
- scripts/ui-catalog-snap.mjs
- scripts/cp-visual-snap.mjs

## Flags ajoutés (SSOT)
- ui_preview_storage_shadow (OFF)
- ui_catalog_snap_storage_shadow (OFF)
- cp_visual_snap_storage_shadow (OFF)

## Proofs
- audit-chemins-non-regression: PASS
- gate:ssot:paths: PASS
- gate:ssot: PASS
- gate:routing:ssot: PASS
- gate:gates:sanity: PASS
- build:cp: PASS
- build:app: PASS

## Risque / Activation
Activation progressive recommandée:
1) activer en environnement de dev interne (ROLLOUT)
2) observer logs de shadow emit (volume / payload)
3) passer ON si stabilité confirmée
