# MODULE_MANIFEST_SCHEMA_V1 (SSOT)

## Objectif
Définir un **contrat de module** stable, auditable et “platform-native”.

Un module doit être :
- installable/désinstallable sans effet de bord
- sandboxable
- sans dépendance directe module → module
- sans imports vers app/ ou server/
- contract-first (API exposée via contracts + services)

## Fichiers attendus
- `modules/<module>/manifest/module.json`

## Champs obligatoires (V1)
- `schema_version`: `"MODULE_MANIFEST_SCHEMA_V1"`
- `id`: string (kebab-case, unique)
- `display_name`: string
- `owner`: string (team / org)
- `surface`: `"app"` | `"cp"` | `"both"`
- `entrypoints`:
  - `ui`: string[] (chemins relatifs dans le module)
  - `api`: string[] (chemins relatifs dans le module)
- `capabilities`: string[] (ex: `"storage.read"`, `"jobs.write"`)
- `entitlements`: string[] (ex: `"jobs.basic"`, `"docs.ocr"`)
- `data_namespaces`: string[] (ex: `"jobs"`, `"crm"`)
- `contracts`:
  - `provided`: string[] (chemins relatifs vers `core-kernel/src/contracts/**` ou `modules/<m>/contracts/**`)
  - `required`: string[]
- `policy`:
  - `rbac_scopes`: string[]
  - `safe_mode`: `"allowed"` | `"cp-only"` | `"blocked"`
- `lifecycle`:
  - `install`: `"idempotent"`
  - `uninstall`: `"idempotent"`
  - `migrations`: `"append-only"` | `"none"`
- `compat`:
  - `min_core`: string (semver)
  - `tested_with`: string[] (tags/versions)

## Règles non négociables
- Interdit: import direct vers `app/src/**` ou `server/src/**`
- Interdit: import direct `modules/<a> → modules/<b>`
- Autorisé: `modules → core-kernel/src/contracts` et `modules → platform-services/*` via façades
- Storage: uniquement via `shared/*`/`platform/*` (pas de localStorage direct hors allowlist)
