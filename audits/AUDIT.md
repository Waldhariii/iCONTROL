# AUDIT A→Z — Isolation pages / SSOT / Dedup / Responsive

## Synthèse exécutive

- Pages analysées: **128**

- Pages V2 (heuristique): **10**

- Pages avec export render*: **67**

- Removable candidates: **70**

- Violations contrat de page (heuristique): **56**


## P0 — Indispensable (réduction risques immédiats)

1) **Contrat de page**: un seul entrypoint public `renderXPage(root)` + async interne; aucune fonction exportée secondaire.

2) **Interdiction page→page**: partager via `core/ui/*` et `core/services/*` uniquement.

3) **SSOT navigation**: confirmer `commandPalette.ts` comme seule source; supprimer/neutraliser sources parallèles.

4) **Responsive hardening**: imposer `min-width:0` sur wrappers flex/grid + `width:100%` + `box-sizing:border-box`.

5) **Error taxonomy**: normaliser ERR_*/WARN_* sur toutes pages (compat avec ton système de classement).


## P1 — Structuration (maintenabilité / performance)

- Extract primitives SSOT:

  - `core/ui/primitives`: PageShell, SectionCard, Toolbar, DataTable, Empty/Error, Badges

  - `core/ui/charts`: donutGauge, miniBars, lineChart + tokens

  - `core/runtime/safe`: safeRender, fetchJsonSafe, safeMode mapping

- Ajouter un générateur d’inventaire (depuis moduleLoader + commandPalette) pour garder la vérité source.


## P2 — Industrialisation (CI / qualité)

- Regrouper les workflows `cp-*-proofs.yml` en un job unique (évite du drift).

- Ajouter ESLint minimal (no-redeclare/no-dupe-imports/no-shadow).


## Fichiers produits

- audits/PAGE_IMPORT_MATRIX.json

- audits/PAGE_REMOVABILITY.json

- audits/PAGE_CONTRACT_VIOLATIONS.md

- audits/RESPONSIVE_RISKS.md

- audits/DUPLICATES_REPORT.md

- audits/PROOFS_INVENTORY.md
