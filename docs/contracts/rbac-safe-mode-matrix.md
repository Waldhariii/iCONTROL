# iCONTROL — Matrice RBAC / SAFE_MODE (Non-core)

## Pages (entrées)

| Page | Roles autorisés | SAFE_MODE STRICT | Notes |
|---|---|---|---|
| dashboard | ADMIN, SYSADMIN, DEVELOPER | Autorisé | Lecture seule |
| users | ADMIN, SYSADMIN, DEVELOPER | Autorisé | Tables read-only |
| account | ADMIN, SYSADMIN, DEVELOPER | Autorisé | Stockage local uniquement |
| verification | ADMIN, SYSADMIN, DEVELOPER | Autorisé | SAFE_MODE self-check |
| developer | SYSADMIN, DEVELOPER | Autorisé | Toolbox read-only |
| settings | ADMIN, SYSADMIN | Autorisé | Hors branding |
| settings_branding | ADMIN, SYSADMIN | Autorisé | Branding strict |

## Sections spécifiques (Developer)

| Section | Roles autorisés | SAFE_MODE STRICT | Notes |
|---|---|---|---|
| toolbox-registry-viewer | SYSADMIN, DEVELOPER | Autorisé | Vue registry |
| toolbox-contracts-table | SYSADMIN, DEVELOPER | Autorisé | TableDef |
| toolbox-contracts-form | SYSADMIN, DEVELOPER | Autorisé | FormDef |
| toolbox-datasources | SYSADMIN, DEVELOPER | Partiel | Sources externes marquées “blocked” |
| toolbox-rules | SYSADMIN | Autorisé | Règles |
| toolbox-audit-log | SYSADMIN, DEVELOPER | Autorisé | Journal UI (read-only) |
