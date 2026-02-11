# D4 — AUTO_ADAPT_SYSTEM_SPEC (Mécanisme auto-adaptatif)

**Objectif:** Quand on ajoute une "page métier" (module), le système l’enregistre automatiquement, génère le wiring (route/menu/permissions), applique le design system (tokens) sans CSS sauvage, ajoute les entitlements par défaut (OFF/VIEW/ACTIVE), met à jour manifest + release gates, et échoue en CI si invariants cassés.

**Date:** 2026-01-27.  
**Référence:** Bloc #2 (Mandat enterprise-grade++), Phase 2 EXECUTION_ROADMAP_AZ.

---

## 1. Comportement cible

| Action | Résultat attendu |
|--------|------------------|
| Ajout d’un module/page (manifeste + implémentation) | Enregistrement automatique dans registry modules (SSOT). |
| Build / dev | Génération automatique : routing table (client/admin), nav/menu structure, permission matrix, entitlements catalog, alignement release manifest. |
| Design | Tokens appliqués par construction ; aucun style ad hoc autorisé (lint/gate). |
| Entitlements | Par défaut OFF/VIEW/ACTIVE selon convention ; matrice tenant→plan mise à jour ou validée. |
| CI | Si module sans manifeste ou sans test minimal → FAIL. Si style hors tokens → FAIL. |

---

## 2. Standard de module (SSOT) — B1

Chaque module/page doit avoir un **manifeste minimal** (ex. `manifest.json` ou `module.ts` au sein du module).

### 2.1 Champs obligatoires

| Champ | Type | Description |
|-------|------|-------------|
| `id` | string | Identifiant stable (ex. `biz.crm.contacts`, `core.dossiers`). |
| `name` | string | Libellé affiché. |
| `type` | `"core"` \| `"complementary"` | Core = toujours on ; complementary = activable. |
| `version` | string | Semver. |
| `app_surface` | `"admin"` \| `"client"` \| les deux | Surface(s) concernée(s). |
| `routes` | array | Liste des routes : `{ id, path, title?, icon?, navGroup?, permissions_required? }`. |
| `permissions_scopes` | array? | Scopes RBAC requis (ex. `["read:crm", "write:crm"]`). |
| `entitlements_default` | object? | `{ visibility: "OFF"|"VIEW"|"ACTIVE", feature_flag_id?: string }`. |
| `data_namespace` | string? | Clé namespace storage (ex. `crm.contacts.v1`). |
| `dependencies_platform` | array? | Services requis : storage, queue, export, search. |
| `tests_contractuels` | array? | Liste des tests requis (fichiers ou noms). |

### 2.2 Emplacement

- **Convention:** `modules/<module-id>/manifest/manifest.json` (ou équivalent TypeScript exporté).
- **Référence actuelle:** `modules/core-system/manifest/manifest.json`, `modules/_module-template/manifest/manifest.json`.

### 2.3 Alignement avec ROUTE_CATALOG et TENANT_FEATURE_MATRIX

- Chaque `route` du manifest doit avoir un correspondant dans ROUTE_CATALOG (route_id, path, app_surface, permissions_required, tenant_visibility).
- Les plans (FREE/PRO/ENTERPRISE) dans TENANT_FEATURE_MATRIX référencent `enabled_pages` (route_ids) et `enabled_modules` ; l’auto-discovery peut **générer** ou **valider** ces entrées à partir des manifests.

---

## 3. Auto-discovery — B2

### 3.1 Moment d’exécution

- **Build-time** (recommandé) : script Node qui scanne `modules/**/manifest/*` et génère des artefacts (registry, routing table, nav, permission matrix, entitlements catalog).
- **Dev-time** : même script exécutable en watch pour feedback immédiat.

### 3.2 Entrées

- Arborescence `modules/` (exclure `_module-template` ou l’inclure comme référence).
- Fichiers `manifest.json` (ou `manifest.ts` exportant un objet conforme).

### 3.3 Sorties générées

| Artefact | Contenu | Usage |
|----------|---------|--------|
| **Registry modules** | Liste des modules avec id, version, routes, entitlements_default. | SSOT pour "quels modules existent". |
| **Routing table** | Liste des route_id, path, app_surface, page_module_id, permissions_required. | Alimentation ou validation de ROUTE_CATALOG.json. |
| **Nav/menu structure** | Arborescence par app_surface (admin, client), par navGroup. | Génération sidebar / menu. |
| **Permission matrix** | Mapping route_id → permissions_required ; agrégation des scopes par module. | Validation RBAC, gates. |
| **Entitlements catalog** | Liste des features/pages avec entitlement par défaut (OFF/VIEW/ACTIVE). | Alimentation ou validation TENANT_FEATURE_MATRIX / capability-status. |
| **Release manifest** | Versions des modules, checksum ou hash pour rollback. | Alignement avec gates release. |

### 3.4 Politique de génération

- **Option A :** Fichiers `_generated/*` commités (diff stable, revu en PR).
- **Option B :** Build-artifacts uniquement (non commités) ; CI régénère et compare au ROUTE_CATALOG / TENANT_FEATURE_MATRIX existants (gate "drift").
- **Recommandation (audit):** Option B ou hybride : générer dans `runtime/configs/ssot/` ou `docs/ssot/` avec gate de non-régression (comme gate:route-drift).

### 3.5 Intégration avec moduleLoader et registries

- Aujourd’hui : `moduleLoader.ts` et `CP_PAGES_REGISTRY` / `APP_PAGES_REGISTRY` sont **manuels** (if/else par route_id, imports dynamiques).
- Cible : soit (1) générer le code du moduleLoader et des registries à partir des manifests (codegen), soit (2) garder un registre dynamique chargé depuis un JSON généré (registry chargé au boot) et un seul point d’enregistrement "route_id → loader". La solution (2) réduit la refactor du moduleLoader à un "dispatcher" unique qui lit le registry généré.

---

## 4. Gates contractuels (bloquants) — B3

| Gate | Règle | Bloquant |
|------|-------|----------|
| **Tenant isolation** | Aucune route/module sans tenant context (tenant_id disponible au render). | Oui |
| **Write gateway** | Aucun write direct bypass (localStorage, config, toggles) hors Write Gateway. | Oui |
| **Safe render** | Exports/UI listés passent par filtre d’accès (Safe Render). | Oui |
| **Style system** | Aucun nouveau CSS global non autorisé ; tokens obligatoires (couleurs, spacing). | Oui |
| **Module completeness** | Un module avec page exposée doit avoir : manifeste valide + au moins un test contractuel (ou liste explicite d’exclusion). | Oui |

### 4.1 Implémentation

- **Tenant isolation :** test contractuel qui vérifie que pour chaque route rendue, `getTenantId()` ou équivalent est appelé / injecté ; gate CI.
- **Write gateway :** gate existant `gate:write-gateway-coverage` étendu à 100% des surfaces d’écriture (voir D1).
- **Safe render :** gate sur les points d’export (PDF/CSV) pour vérifier passage par moteur filtré.
- **Style system :** gates existants (gate:ui-drift, gate:design-tokens) + lint règles (PAGE_BOUNDARY_LINT, pas de couleurs en dur).
- **Module completeness :** nouveau gate : pour chaque entrée de ROUTE_CATALOG avec page_module_id, vérifier existence d’un manifest dans le module concerné et présence d’au moins un test listé ou fichier `*.contract.test.ts` dans le module.

---

## 5. Design system "par construction" — B4

- **Tokens centralisés :** source unique `runtime/configs/ssot/design.tokens.json` ; génération CSS vars via `generate-design-tokens-css.mjs`.
- **Deux thèmes isolés :** Admin (cp-dashboard-charcoal) et Client (app-foundation-slate) ; override par tenant (branding) contrôlé via themeManager / config brand.
- **Interdiction styles legacy :** lint rules (ESLint / script) qui rejettent couleurs en dur (hex, rgb, rgba) hors `var(--*)` dans les fichiers des modules ; allowlist explicite pour exceptions.
- **Catalogue UI (snapshots) :** scripts `ui-catalog-snap.mjs`, `cp-visual-snap.mjs` ; intégration en CI pour détecter régressions visuelles (optionnel mais recommandé).

---

## 6. Procédure "comment ajouter une page métier" (cible 5 minutes)

1. Créer ou étendre un module sous `modules/<module-id>/`.
2. Ajouter ou mettre à jour `manifest/manifest.json` (id, routes, entitlements_default, data_namespace, tests_contractuels).
3. Implémenter la page (ex. `modules/<module-id>/ui/frontend-ts/pages/<page>/`) et exporter un render (ex. `renderDossiersPage(root)`).
4. Lancer le script d’auto-discovery (build-time ou npm run generate:module-registry ou équivalent).
5. Vérifier que ROUTE_CATALOG et TENANT_FEATURE_MATRIX sont alignés (ou générés) ; si manuel, ajouter route_id et enabled_pages.
6. Brancher le rendu dans le moduleLoader ou le registry généré (si codegen : régénérer ; si registry JSON : ajouter entrée route_id → chemin d’import).
7. Ajouter au moins un test contractuel (ou lister en exclusion dans le manifest).
8. Exécuter gates : `npm run gate:ssot`, `npm run gate:route-catalog`, `npm run gate:tenant-matrix`, `npm run gate:design-tokens`, `npm run gate:module-completeness` (à créer).
9. CI garantit le wiring : si tout est vert, la page est exposée selon entitlements et permissions.

---

## 7. Dépendances avec EXECUTION_ROADMAP_AZ

- **Phase 2.1** : Standard manifeste (convention + _module-template).
- **Phase 2.2** : Auto-discovery + génération (script + artefacts).
- **Phase 2.3** : Lint + gates (style system + module completeness).
- **Phase 2.4** : Release manifest + rollback.
- **Phase 2.5** : Documentation (cette procédure).

---

*Spec alimentant D5 (BACKLOG_READY) et l’implémentation Phase 2.*
