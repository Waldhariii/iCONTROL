# Inventaire des styles — DIRECTIVE REPRODUCTION VISUELLE

**Objectif :** Tous les styles listés ci‑dessous seront désactivés puis supprimés, sauf ceux fusionnés dans **STYLE_ADMIN_FINAL** et **STYLE_CLIENT_FINAL** après reproduction exacte depuis les images de référence.

---

## 1. Fichiers CSS (à supprimer ou remplacer)

| Fichier | Périmètre | Remplacé par |
|---------|-----------|--------------|
| `platform-services/ui-shell/layout/shell.css` | Shell (header, drawer, main, nav, burger) — Admin + Client | STYLE_ADMIN_FINAL / STYLE_CLIENT_FINAL |
| `app/src/pages/cp/login.css` | Page login CP | STYLE_ADMIN_FINAL |
| `app/src/pages/app/client-foundation.css` | client-disabled, client-access-denied, client-catalog | STYLE_CLIENT_FINAL |

---

## 2. Styles inline / `style.cssText` / `setAttribute("style", …)`

**Fichiers concernés (à migrer vers tokens/classes des deux styles finaux) :**

- `app/src/pages/cp/views/users.ts`
- `app/src/pages/cp/dashboard.ts`
- `app/src/pages/cp/tenants.ts`
- `app/src/pages/cp/feature-flags.ts`
- `app/src/pages/cp/entitlements.ts`
- `app/src/pages/cp/login-theme.ts`
- `app/src/pages/cp/integrations.ts`
- `app/src/pages/cp/publish.ts`
- `app/src/pages/cp/pages.ts`
- `app/src/pages/cp/users.ts`
- `app/src/pages/cp/system.ts`
- `app/src/pages/cp/subscription.ts`
- `app/src/pages/cp/audit.ts`
- `app/src/core/ui/charts.ts`
- `app/src/core/ui/skeletonLoader.ts`
- `app/src/core/ui/errorState.ts`
- `app/src/core/ui/toolbar.ts`
- `app/src/core/ui/badge.ts`
- `app/src/core/ui/toast.ts`
- `modules/core-system/ui/frontend-ts/pages/access-denied/index.tsx`
- `modules/core-system/ui/frontend-ts/pages/developer/index.tsx`
- `modules/core-system/ui/frontend-ts/pages/system/sections/cache-audit.ts`
- `modules/core-system/ui/frontend-ts/pages/logs/index.ts`
- `modules/core-system/ui/frontend-ts/pages/toolbox/**`
- `modules/core-system/ui/frontend-ts/pages/_shared/uiBlocks.ts`
- `modules/core-system/ui/frontend-ts/pages/_shared/sections.ts`
- `app/src/pages/_shared/sections.ts`

---

## 3. Styles générés en TS (strings CSS)

| Fichier | Export / usage | Remplacé par |
|---------|----------------|--------------|
| `modules/core-system/ui/frontend-ts/shared/coreStyles.ts` | `coreBaseStyles()` — tokens :root, .cxWrap, .cxCard, .cxTitle, .cxMuted, .cxRow, .cxField, .cxLabel, .cxInput, .cxBtn, etc. | Tokens et classes dans STYLE_ADMIN_FINAL / STYLE_CLIENT_FINAL |

**Usages de `coreBaseStyles()` :**  
logs, dashboard (core-system + cp), tenants, feature-flags, entitlements, login-theme, integrations, publish, pages, users, system, subscription, audit, notfound, blocked, access-denied (cp), login (cp), loginPage, dashboardPage.

---

## 4. Thèmes / presets / providers (à désactiver et supprimer)

| Source | Rôle | Action |
|--------|------|--------|
| `app/src/main.ts` | `__ICONTROL_APPLY_THEME_SSOT__` — `loadThemePreset` + `applyThemeTokensToCssVars` | Désactiver ; plus aucun chargement de preset |
| `app/src/main.ts` | `applyThemeTokensToCSSVars` (themeCssVars) dans le mount shell | Désactiver ; tokens fournis par STYLE_*_FINAL |
| `app/src/core/theme/loadPreset.ts` | `loadThemePreset` | Supprimer / ne plus appeler |
| `app/src/core/theme/applyThemeCssVars.ts` | `applyThemeTokensToCssVars` | Supprimer / ne plus appeler |
| `app/src/core/theme/presets/*.json` | cp-dashboard-charcoal, app-foundation-slate | Supprimer |
| `app/src/core/theme/themeTokens.ts` | Types ThemeTokens | Supprimer ou réduire à un contrat minimal si nécessaire |
| `app/src/core/theme/themeManifest.ts` | Manifeste thèmes | Supprimer |
| `modules/core-system/.../themeCssVars.ts` | `applyThemeTokensToCSSVars`, `MAIN_SYSTEM_THEME` | Désactiver / supprimer |
| `modules/core-system/.../mainSystem.data.ts` | `MAIN_SYSTEM_THEME.tokens` | Ne plus utiliser pour le style ; à supprimer ou restreindre |
| `app/src/core/ui/themeManager.ts` | Gestion thème, `applyTheme` | Désactiver / supprimer ou réduire au strict minimum |
| `runtime/configs/ssot/design.tokens.json` | base / presets / cssVarsMapping | Ne plus charger pour le rendu ; à adapter ou supprimer |

---

## 5. Styles spécifiques Login CP

| Fichier | Rôle | Remplacé par |
|---------|------|--------------|
| `app/src/pages/cp/login.ts` | `applyThemeVars(wrapper, theme, effects)` — variables --cp-login-* | STYLE_ADMIN_FINAL (section login) |
| `app/src/pages/cp/ui/loginTheme/*` | Thèmes login (presets, override) | Répliquer uniquement ce qui est visible dans les images Admin |

---

## 6. Guards de styles (à réviser)

- `main.ts` : `__icontrol_installAdminStyleGuard__`, `__icontrol_installClientStyleGuard__`  
  À adapter pour n’autoriser que les feuilles / inline liés à STYLE_ADMIN_FINAL et STYLE_CLIENT_FINAL.

---

## 7. Fichiers à conserver — SEULES exceptions

- `app/src/styles/STYLE_ADMIN_FINAL.css` — style Administration (CP) — **créé (squelette)** ; à remplir depuis images Admin.
- `app/src/styles/STYLE_CLIENT_FINAL.css` — style Client (APP) — **créé (squelette)** ; à remplir depuis images Client.

Aucun autre fichier de style ne doit rester actif après la directive.
