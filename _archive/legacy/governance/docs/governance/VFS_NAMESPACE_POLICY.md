# VFS Namespace Policy (V1)

## Objectif
Empêcher toute dérive de chemins/paths bruts et standardiser le storage multi-tenant via **namespaces**.

## Règles
- Aucune utilisation de paths système (ex: `/Users/...`, `../`, `~`, `C:\`).
- Namespace doit matcher:
  - `tenant/<tenantId>/...`
  - `public/...` (si applicable)
- `key` = identifiant logique (ex: `theme.json`), **pas un path** (interdit: `../x`, `/abs`, `C:\x`).

## Examples
- ✅ namespace: `tenant/t1/overrides`, key: `theme.json`
- ❌ namespace: `../../secrets`, key: `pw`
