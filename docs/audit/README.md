# Stratégie d’audit iCONTROL

Les audits garantissent l’isolation du core, le SSOT routing, l’absence de fuites (chemins, tokens) et la conformité UI (contraste, couleurs, design system).

## Emplacements

- **Scripts** : `scripts/audit/` (voir [README des scripts](../../scripts/audit/README.md))
- **Rapports (chemins / non-régression)** : `docs/audit/reports/`

## Ordre d’exécution recommandé

### 1. À chaque commit (pre-commit)

1. `./scripts/audit/audit-no-leaks.zsh`

### 2. Avant push / CI (gates)

1. `./scripts/audit/audit-no-leaks.zsh`
2. `./scripts/audit/audit-chemins-non-regression.sh`
3. Gates SSOT (route-catalog, route-drift, tenant-matrix, design-tokens, etc.) — voir `scripts/gates/` et runbooks.

### 3. Release candidate

1. Arbre Git propre
2. `./scripts/audit/audit-release-candidate.zsh`  
   (enchaîne no-leaks, UI contrast, UI no hardcoded colors, thème/cssvars si présents, puis build + tests)

### 4. Analyse ponctuelle

- **Audit système complet** : `node scripts/audit/audit-system-complete.mjs`
- **Subscription / découplage** : `./scripts/audit/audit-subscription-no-ui-coupling.zsh`
- **Node builtins (app / client)** : `audit-no-node-builtins-in-app.zsh`, `audit-no-node-builtins-in-client-surface.zsh`

## Rapports

| Audit | Répertoire / fichier |
|-------|----------------------|
| Non-régression chemins / routing | `docs/audit/reports/AUDIT_NON_REGRESSION_CHEMINS.md` |
| No-leaks | `_REPORTS/ICONTROL_AUDIT_NO_LEAKS_*.md` |
| UI (couleurs, thème) | `_REPORTS/ICONTROL_*_*.md` |

Les rapports sous `docs/audit/reports/` sont des artefacts d’audit ; ne pas les éditer à la main.
