# iCONTROL — Runbook SAFE_MODE

## Objectif
Expliquer la posture SAFE_MODE côté UI (non-core).

## Modes
- `STRICT`: sections non autorisées affichées en warning, aucune action externe.
- `COMPAT`: sections visibles, actions limitées au contrat UI.

## Vérification rapide
1) Définir SAFE_MODE:
```js
window.ICONTROL_SAFE_MODE = "STRICT";
```
2) Rafraîchir la page et vérifier:
- Sections bloquées visibles avec `WARN_SECTION_BLOCKED`.
- Datasources externes marquées `blocked`.
