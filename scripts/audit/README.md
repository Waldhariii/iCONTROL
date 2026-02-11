# Scripts d’audit iCONTROL

Tous les audits du système sont centralisés ici. Voir aussi **`docs/audit/governance/docs/STANDARDS/README.md`** pour la stratégie et l’ordre d’exécution.

## Index des scripts

| Script | Rôle | Sortie / Bloquant |
|--------|------|-------------------|
| **audit-no-leaks.zsh** | Chemins hardcodés (`/Users/`), token legacy, isolation core-kernel, couplage module→module | `_REPORTS/ICONTROL_AUDIT_NO_LEAKS_*.md` — **bloquant** (pre-commit) |
| **audit-chemins-non-regression.sh** | Non-régression routing SSOT : imports `runtime/router`, registries, doublons de routes | `docs/audit/reports/AUDIT_NON_REGRESSION_CHEMINS.md` — **bloquant** (gate) |
| **audit-release-candidate.zsh** | Suite complète RC : arbre propre + no-leaks + UI (contrast, colors, cssvars) + build + tests | — **bloquant** (release) |
| **audit-ui-contrast.zsh** | Pas d’opacité inline sur les lignes de texte (contraste) | — **bloquant** |
| **audit-ui-no-hardcoded-colors.zsh** | Pas de couleurs en dur (rgba/rgb/hex) dans les styles inline | `_REPORTS/ICONTROL_*_*.md` — **bloquant** |
| **audit-ui-theme-cssvars.zsh** | Thème / CSS vars (alignement design system) | `_REPORTS/ICONTROL_AUDIT_UI_THEME_CSSVARS_*.md` |
| **audit-ui-cssvars-rollout.zsh** | Rollout CSS vars (pages uniquement, hors `_shared`) | — **bloquant** si utilisé |
| **audit-ui-cssvars-backlog-shared.zsh** | Backlog TOK.* dans `_shared` (signal, non-bloquant) | — optionnel |
| **audit-subscription-no-ui-coupling.zsh** | Subscription : pas d’import write-model depuis UI/pages ; runtime app via facade uniquement | — **bloquant** |
| **audit-no-node-builtins-in-app.zsh** | Pas de `node:*` dans le bundle app | — **bloquant** |
| **audit-no-node-builtins-in-client-surface.zsh** | Pas de `node:*` dans le code client livré (hors tests) | — **bloquant** |
| **audit-system-complete.mjs** | Analyse A–Z : catalogue routes, doublons, routes inactives, cross-imports, chemins | Sortie console (rapport global) |

## Exécution rapide

- **Pre-commit (obligatoire)** : `./scripts/audit/audit-no-leaks.zsh`
- **Gate routing SSOT** : `./scripts/audit/audit-chemins-non-regression.sh`
- **Release candidate** : `./scripts/audit/audit-release-candidate.zsh` (depuis la racine du repo)
- **Audit système complet** : `node scripts/audit/audit-system-complete.mjs`

## Rapports

- **Chemins / routing** : `docs/audit/reports/` (créé par `audit-chemins-non-regression.sh`)
- **No-leaks, UI** : `_REPORTS/` à la racine (si les scripts les génèrent)
