# iCONTROL — Architecture (Golden Baseline)

## Objectif
Plateforme modulaire long terme, avec isolation stricte par modules et UI shell stable.

## Couches
- core-kernel/: noyau (branding, règles, contrats) — ne dépend jamais des modules
- platform-services/: services transverses (UI shell, routing helpers)
- modules/: modules métiers (core-system = auth/login/dashboard/settings)
- app/: shell Vite (boot + router + mount + module loader)
- shared/: librairies partagées (design-system)

## Règles d’isolation
- core-kernel ne doit pas importer modules/
- modules ne doivent pas importer d’autres modules directement
- UI shell = stable, pages rendues dans cxMain via getMountEl()

## Qualité & garde-fous
- scripts/audit/audit-no-leaks.zsh (pre-commit)
- build: app -> Vite build

## Baseline Governance

### Tags (source of truth)
- **golden-baseline** : alias mobile (peut bouger quand une baseline est re-validée).
- **golden-baseline-2026-01-09-r1** : snapshot immuable (référence stable pour audit/rollback).

### SOP (opérations)
- Créer une branche de travail depuis la baseline immuable:
  - `git checkout -b feature/<nom> golden-baseline-2026-01-09-r1`
- Ou depuis l’alias (si tu acceptes que ça bouge dans le temps):
  - `git checkout -b feature/<nom> golden-baseline`

### Qualité (hard gates)
- Audit: `./scripts/audit/audit-no-leaks.zsh`
- Build: `npm run build:app` (or `npm run build:cp` for Control Plane)

