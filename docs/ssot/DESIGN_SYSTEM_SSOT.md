# DESIGN_SYSTEM_SSOT

**Sources:** `mainSystem.data.ts` (MAIN_SYSTEM_THEME, MAIN_SYSTEM_TABLE_CONTRACT, MAIN_SYSTEM_FORM_CONTRACT), `app/src/core/theme/` (themeTokens, presets, applyThemeCssVars, loadPreset), `app/src/core/ui/`, `modules/core-system/.../shared/coreStyles.ts`  
**Généré:** 2026-01-24 (sans CODEX)

## 1. Tokens (SSOT)

- **Base (MAIN_SYSTEM_THEME.tokens):** titleSize, radius, border, bg, panel, card, text, mutedText, accent, accent2, shadow, font, mono.
- **Presets (ThemeTokens):** appBgPrimary, appBgSecondary, appBgGradient, surface0, surface1, surfaceBorder, textPrimary, textMuted, accentPrimary, accentGlow, shadowMd, shadowLg; optionnel `cpLogin` (pageBg, panelBg, cardBg, inputBg, buttonBg).
- **Fichiers:** `config/ssot/design.tokens.json`; presets dans `app/src/core/theme/presets/*.json`.
- **Application:** `applyThemeTokensToCssVars`, `loadThemePreset`; bootstrap dans `main.ts` (`__ICONTROL_APPLY_THEME_SSOT__`).

### 1.1 Alias --ic-* (coreStyles)

Les composants UI et pages consomment **uniquement** `var(--ic-*)`. Définition dans `modules/core-system/.../shared/coreStyles.ts` (allowlistée par la gate UI_DRIFT).

| Groupe | Tokens |
|--------|--------|
| **Surfaces** | --ic-bg, --ic-panel, --ic-card, --ic-inputBg |
| **Texte** | --ic-text, --ic-mutedText |
| **Accent** | --ic-accent, --ic-accent2 |
| **Bordures** | --ic-border, --ic-borderLight, --ic-borderLightStrong, --ic-borderLightMuted, --ic-borderDark, --ic-borderDarkStrong, --ic-borderDarkMuted |
| **Overlay / highlight** | --ic-overlay, --ic-overlayLight, --ic-highlight, --ic-highlightMuted, --ic-highlightSubtle, --ic-surfaceOverlay, --ic-surfaceOverlayStrong |
| **Statuts (couleur)** | --ic-success, --ic-warn, --ic-error, --ic-info |
| **Statuts (Bg/Border)** | --ic-successBg, --ic-successBorder, --ic-warnBg, --ic-warnBorder, --ic-errorBg, --ic-errorBorder, --ic-infoBg, --ic-infoBorder, --ic-accentBg, --ic-accentBorder |
| **Utilitaires** | --ic-radius-lg, --ic-radius-md, --ic-radius-sm, --ic-shadowToast, --ic-shimmer |

## 2. Composants UI (app/src/core/ui)

| Composant | Fichier | Rôle |
|-----------|---------|------|
| dataTable | dataTable.ts | Tables (MAIN_SYSTEM_TABLE_CONTRACT) |
| badge | badge.ts | Badges, statuts |
| toast | toast.ts | Notifications toast |
| emptyState | emptyState.ts | État vide |
| errorState | errorState.ts | Erreur |
| sectionCard | sectionCard.ts | Cartes de section |
| pageShell | pageShell.ts | Enveloppe de page |
| charts | charts.ts | Graphiques |
| themeManager | themeManager.ts | Gestion thème |
| catalog | catalog/ | UI catalog |
| clientSidebar | clientSidebar.tsx | Sidebar client |
| skeletonLoader | skeletonLoader.ts | Squelette de chargement |
| toolbar | toolbar.ts | Barre d’outils |
| kpi | kpi.ts | KPI |

## 3. Contrats

- **MAIN_SYSTEM_TABLE_CONTRACT:** columnFields, columnTypes, actionTypes.
- **MAIN_SYSTEM_FORM_CONTRACT:** fieldTypes, validation, roleVisibility.

## 4. États et interdictions

- **États:** empty (emptyState), error (errorState), loading (skeletonLoader).
- **Interdictions:** pas de styles/`<link>` non gouvernés (ADMIN_STYLE_GUARD, CLIENT_STYLE_GUARD); pas de couleurs/spacing en dur hors tokens/CSS vars.

## 5. Fichiers de référence

- `config/ssot/design.tokens.json`
- `app/src/core/theme/themeTokens.ts`
- `app/src/core/theme/loadPreset.ts`
- `app/src/core/theme/applyThemeCssVars.ts`
- `modules/core-system/.../shared/coreStyles.ts` — alias --ic-* (overlay, highlight, statuts, bordures)
- `modules/core-system/.../mainSystem.data.ts`
