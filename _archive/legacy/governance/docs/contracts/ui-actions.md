# iCONTROL — Contrat Actions UI (Non-core)

## Actions autorisées (SSOT)
- `navigate`: navigation interne (hash routes existantes seulement).
- `exportCsv`: export local des tableaux visibles.
- `noop`: action explicitement inerte (audit-friendly).

## Actions interdites (tant que non contractées)
- `openModal`
- `fetch` / appels réseau
- Exécution de scripts ou injections HTML

## Règles d’implémentation
- Aucune handler inline (`on*`).
- Les listeners sont bindés via `addEventListener`.
- Toute action doit émettre un code d’observabilité (`WARN_*`/`ERR_*`).

## Observabilité minimale
Exemples:
- `WARN_ACTION_BLOCKED`
- `WARN_ACTION_EXECUTED`
- `WARN_EXPORT_EMPTY`
