# Plan — DIRECTIVE REPRODUCTION VISUELLE + SUPPRESSION DÉFINITIVE DES STYLES

## Règle fondamentale

> Les images de référence fournies sont la **SOURCE DE VÉRITÉ VISUELLE ABSOLUE**.  
> Reproduire exactement. Aucune interprétation, amélioration, approximation, mélange ancien/nouveau, ni conservation « au cas où ».

---

## Statut actuel

**EN ATTENTE DES IMAGES DE RÉFÉRENCE**

- **Images Admin** : à fournir (écrans CP : login, dashboard, shell, pages listées dans STYLE_INVENTORY)
- **Images Client** : à fournir (écrans APP : login, client-disabled, client-foundation, shell, etc.)

**Squelettes créés (prêts à recevoir les tokens/valeurs depuis les images) :**
- `app/src/styles/STYLE_ADMIN_FINAL.css` — selectors Shell, Login, composants (.cxWrap, .cxCard, etc.) ; `:root` avec placeholder ; valeurs à remplir depuis images Admin.
- `app/src/styles/STYLE_CLIENT_FINAL.css` — selectors Shell, [data-scope="client-foundation"], .cf-* ; valeurs à remplir depuis images Client.

Sans les images, les étapes 2 (reproduction), 3 (validation) et 4 (suppression physique) ne peuvent pas être exécutées. Les imports (shell.css, login.css, client-foundation.css) et `__ICONTROL_APPLY_THEME_SSOT__` / `applyThemeTokensToCSSVars` / `coreBaseStyles()` ne doivent **pas** être modifiés tant que les deux styles finaux ne sont pas remplis depuis les images.

---

## Procédure (à exécuter lorsque les images sont fournies)

### ACTION 1 — Retirer l’autorité des styles existants

- [ ] Désactiver `__ICONTROL_APPLY_THEME_SSOT__` dans `main.ts` (ne plus appeler `loadThemePreset` ni `applyThemeTokensToCssVars` des presets).
- [ ] Désactiver `applyThemeTokensToCSSVars` (themeCssVars) dans le mount shell.
- [ ] Retirer l’import `./shell.css` de `platform-services/ui-shell/layout/shell.ts` et le remplacer par l’injection de STYLE_ADMIN_FINAL ou STYLE_CLIENT_FINAL selon `VITE_APP_KIND`.
- [ ] Retirer l’import `./login.css` de `app/src/pages/cp/login.ts` ; les règles login iront dans STYLE_ADMIN_FINAL.
- [ ] Retirer les imports `./client-foundation.css` des pages app (client-disabled, client-access-denied, client-catalog) ; les règles iront dans STYLE_CLIENT_FINAL.
- [ ] Remplacer tous les appels à `coreBaseStyles()` par l’injection d’un bloc `<style>` ou par des classes définies dans STYLE_ADMIN_FINAL / STYLE_CLIENT_FINAL (selon surface).
- [ ] Désactiver `themeManager.applyTheme` et toute logique de fallback vers un ancien thème.
- [ ] Adapter les style guards (Admin / Client) pour n’accepter que les feuilles et blocs liés à STYLE_ADMIN_FINAL et STYLE_CLIENT_FINAL.

---

### ACTION 2 — Reproduction visuelle

- [ ] Créer **STYLE_ADMIN_FINAL** à partir des images Admin : couleurs, contrastes, espacements, typo, hiérarchie, disposition. Mapper chaque élément visible à des classes ou tokens.
- [ ] Créer **STYLE_CLIENT_FINAL** à partir des images Client : idem.
- [ ] Appliquer les styles **globalement** (feuilles ou tokens sur `:root` / `[data-surface="admin"]` / `[data-surface="client"]`), **jamais** en correction locale.
- [ ] Supprimer progressivement tous les `style.cssText` et `setAttribute("style", ...)` en les remplaçant par des classes ou variables issues des deux styles finaux.

---

### ACTION 3 — Validation avant suppression finale

- [ ] Vérifier que le style Admin couvre tous les écrans clés (login, dashboard, shell, pages CP).
- [ ] Vérifier que le style Client couvre tous les écrans clés (login, client-disabled, etc.).
- [ ] Vérifier qu’aucun ancien CSS (shell.css, login.css, client-foundation.css, coreStyles) n’est chargé.
- [ ] Vérification visuelle : rendu identique aux images.

---

### ACTION 4 — Suppression physique définitive

**APRÈS validation uniquement :**

- [ ] Supprimer `platform-services/ui-shell/layout/shell.css`
- [ ] Supprimer `app/src/pages/cp/login.css`
- [ ] Supprimer `app/src/pages/app/client-foundation.css`
- [ ] Supprimer ou vider `modules/core-system/.../shared/coreStyles.ts` (et retirer tous les usages de `coreBaseStyles()`)
- [ ] Supprimer `app/src/core/theme/loadPreset.ts`, `applyThemeCssVars.ts`, `presets/*.json`, `themeTokens.ts`, `themeManifest.ts` (ou les réduire au strict minimum non visuel)
- [ ] Supprimer ou désactiver `themeCssVars.ts` (applyThemeTokensToCSSVars) et les usages de `MAIN_SYSTEM_THEME` pour le style
- [ ] Supprimer ou fortement réduire `app/src/core/ui/themeManager.ts`
- [ ] Adapter `config/ssot/design.tokens.json` et la gate `design-tokens` si ce fichier reste pour un usage non visuel uniquement
- [ ] Nettoyer tout style inline restant ; aucun backup actif, thème dormant ou fichier « pour référence ».

---

## Fichiers finaux autorisés

| Fichier | Rôle |
|---------|------|
| `app/src/styles/STYLE_ADMIN_FINAL.css` | Styles Administration (CP) — chargé quand `VITE_APP_KIND=CONTROL_PLANE` |
| `app/src/styles/STYLE_CLIENT_FINAL.css` | Styles Client (APP) — chargé quand `VITE_APP_KIND=CLIENT_APP` ou non CP |

Ils peuvent partager une base commune (tokens) si nécessaire, sans conflit.

---

## Phrase à utiliser mot pour mot

> « Reproduis exactement le visuel des images fournies.  
> Ces images remplacent toute règle visuelle précédente.  
> Supprime tous les styles existants,  
> sauf les deux styles finaux : Administration et Client.  
> Aucun autre style ne doit subsister. »

---

## Prochaine étape

**Fournir les images de référence Admin et Client.**  
Dès réception, exécution de ACTION 1 → 2 → 3 → 4 dans l’ordre, sans interprétation.
