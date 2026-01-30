# THEME SSOT — iCONTROL (Enterprise-grade)

## Objectif
- Unifier visuel dashboard + login via **tokens SSOT**
- Permettre preview/publish/rollback sans patch CSS
- Éviter les conflits de cascade

## Fichiers
- core/theme/themeTokens.ts : contrat de tokens
- core/theme/applyThemeCssVars.ts : apply des CSS vars
- core/theme/presets/*.json : presets versionnés
- core/theme/themeManifest.ts : publish/rollback (à brancher au runtime-config plus tard)

## Intégration recommandée (prochaine étape)
1) Dans le bootstrap (main.ts) : résoudre presetId (manifest + experience + preview)
2) Charger preset JSON
3) applyThemeTokensToCssVars(document, tokens)
4) Dans login.css : consommer seulement var(--app-bg-gradient), var(--surface*), etc.
