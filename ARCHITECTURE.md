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
