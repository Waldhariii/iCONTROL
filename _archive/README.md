# _archive — Stockage froid (hors prod)

Dossier **hors structure de production** : snapshots, exports, anciens packs.

## Structure canonique

- **snapshots/** — tar/zip de releases locales, exports DB, sauvegardes datées
- **exports/** — exports ponctuels (logs, csv, backups)
- **legacy/** — anciennes structures migrées (read-only) : governance, design-system, extensions, core
- **unsorted/** — éléments racine déplacés par le Root Hygiene Move Pack (par TS)

## Politique

- Aucun code exécuté depuis _archive en prod.
- Conventions de nommage : préférer `YYYYMMDD-HHMMSS` ou `YYYYMMDD` pour les artefacts datés.
- Idéalement **gitignored** (ou versionné sous contrôle strict pour legacy).
