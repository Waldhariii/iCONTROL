# iCONTROL — Runbook Gates UI

## Objectif
Assurer que toute modification UI (non-core) respecte les gates obligatoires avant commit.

## Gates obligatoires
```sh
./scripts/audit/audit-no-leaks.zsh
(cd app && npm run build)
(cd app && npm run test)
```

## Vérifications manuelles (UI)
1) Démarrer le dev server:
```sh
(cd app && npm run dev -- --port 5176)
```
2) Vérifier routes:
- `#/dashboard`
- `#/users`
- `#/account`
- `#/verification`
- `#/developer`
3) Vérifier SAFE_MODE:
- `STRICT`: sections bloquées visibles avec warning
- `COMPAT`: sections visibles sans actions interdites

## Politique non négociable
- Pas d’inline handlers.
- Actions UI autorisées: `navigate`, `exportCsv`, `noop`.
- Branding uniquement dans `settings_branding`.
