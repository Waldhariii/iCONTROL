# Rapport — Nettoyage baseline système (Audit 2026-01-30)

**Référence :** `scripts/maintenance/clean-baseline-audit.sh`  
**Audit :** `_audit/CLEAN_BASELINE_20260130_200847/`

---

## Résumé


---

## Pages conservées (8 fichiers)

### Client APP (4 pages)
- `app/src/pages/app/client-account.tsx` — Compte (client)
- `app/src/pages/app/client-dashboard.tsx` — Dashboard (client)
- `app/src/pages/app/client-settings.tsx` — Paramètres (client)
- *(Login client : géré via CP)*

### Admin/CP (5 pages)
- `app/src/pages/cp/dashboard.ts` — Dashboard (admin)
- `app/src/pages/cp/login.ts` — Login (admin)
- `app/src/pages/cp/login-theme.ts` — Thème login
- `app/src/pages/cp/settings.ts` — Paramètres (admin)

---

## Pages à mettre en quarantaine (31 fichiers)

### Client APP (8 fichiers)
1. `app/src/pages/app/client-access-denied.ts`
2. `app/src/pages/app/client-catalog.ts`
3. `app/src/pages/app/client-disabled.ts`
4. `app/src/pages/app/client-pages-inventory.ts`
5. `app/src/pages/app/client-system.tsx`
6. `app/src/pages/app/client-users.tsx`
7. `app/src/pages/app/home-app.ts`
8. `app/src/pages/app/registry.ts`

### Admin/CP (23 fichiers)
1. `app/src/pages/cp/_shared/auditOnce.ts`
2. `app/src/pages/cp/_shared/cpDemo.ts`
3. `app/src/pages/cp/_shared/cpLayout.ts`
4. `app/src/pages/cp/_shared/devOnlyRouteGuard.ts`
5. `app/src/pages/cp/_shared/devOnlyRoutes.ts`
6. `app/src/pages/cp/access-denied.ts`
7. `app/src/pages/cp/audit.ts`
8. `app/src/pages/cp/blocked.ts`
9. `app/src/pages/cp/entitlements.ts`
10. `app/src/pages/cp/feature-flags.ts`
11. `app/src/pages/cp/home-cp.ts`
12. `app/src/pages/cp/integrations.ts`
13. `app/src/pages/cp/notfound.ts`
14. `app/src/pages/cp/pages.ts`
15. `app/src/pages/cp/publish.ts`
16. `app/src/pages/cp/registry.ts`
17. `app/src/pages/cp/subscription.ts`
18. `app/src/pages/cp/system.ts`
19. `app/src/pages/cp/tenants.ts`
20. `app/src/pages/cp/ui-catalog.ts`
21. `app/src/pages/cp/ui-showcase.ts`
22. `app/src/pages/cp/users.ts`
23. `app/src/pages/cp/views/users.ts`

---


1. `_ARCHIVES` (1.0M)
2. `_EVIDENCE_STORE` (8.0K)
3. `dist` (824K)
4. `scripts` (4.0K) — **ATTENTION : scripts à la racine System_Innovex_CLEAN, pas dans iCONTROL**
5. `.claude-dev-helper` (64B)

**Note :** Le dossier `_backups` est conservé (contient les quarantaines).

---

## Taille du système

### Avant nettoyage
- **ROOT** : 195M (iCONTROL)
- **REPO** : 148M (node_modules) + 4.4M (app) + 644K (modules) + 600K (docs) + 544K (scripts)

### Après nettoyage (estimé)
- node_modules reste inchangé (dépendances)

---

## Actions requises pour exécuter le nettoyage

### 1. Vérification manuelle
Avant d'exécuter, vérifier que les pages conservées correspondent bien aux besoins :
- Client APP : Dashboard, Settings, Account

### 2. Mise à jour du ROUTE_CATALOG
Après quarantaine, mettre à jour `runtime/configs/ssot/ROUTE_CATALOG.json` pour retirer les routes des pages mises en quarantaine.

### 3. Mise à jour des registries
- `app/src/pages/app/registry.ts` sera mis en quarantaine → créer un nouveau registry minimal
- `app/src/pages/cp/registry.ts` sera mis en quarantaine → créer un nouveau registry minimal

### 4. Exécution du nettoyage

```bash
cd /Users/danygaudreault/System_Innovex_CLEAN/iCONTROL

# Mode DRY-RUN (déjà fait, voir _audit/)
bash scripts/maintenance/clean-baseline-audit.sh

# Mode DESTRUCTIF (après vérification)
DO_DELETE=1 ACK=I_UNDERSTAND_DESTRUCTIVE_DELETE bash scripts/maintenance/clean-baseline-audit.sh
```

### 5. Post-nettoyage (obligatoire après quarantaine)

Exécuter le script **post-clean** pour : inventaire des déplacements, détection des références brisées, réparation SSOT, gates jusqu’à PASS, commit propre.

```bash
cd /Users/danygaudreault/System_Innovex_CLEAN/iCONTROL
bash scripts/maintenance/post-clean-baseline.sh
```

- **Sorties utiles :** `_audit/CLEAN_BASELINE_*/POST_REF_SCAN.txt`, `_audit/POST_CLEAN_MISSING_IMPORTS.txt`
- Si les gates échouent : corriger ROUTE_CATALOG / registries / imports, puis relancer.

### 6. Détail des étapes après quarantaine
Après exécution destructive :
1. Lancer **post-clean** : `bash scripts/maintenance/post-clean-baseline.sh`
2. Créer les nouveaux registries minimaux (app/registry.ts, cp/registry.ts) si nécessaire
3. Mettre à jour ROUTE_CATALOG.json
4. Corriger les imports cassés (voir `_audit/POST_CLEAN_MISSING_IMPORTS.txt`)
5. Relancer les gates jusqu’à vert (le script post-clean fait test + proofs:logs + verify:ssot:fast)
6. Le script post-clean fait le commit propre si les gates passent

---

## Destination des quarantaines

### Pages
`iCONTROL/_backups/quarantine_20260130_200847/pages_pruned_20260130_200847/`

### Root
`/Users/danygaudreault/System_Innovex_CLEAN/_backups/quarantine_20260130_200847/root_pruned_20260130_200847/`

---

## Recommandations

1. **Ne pas exécuter en mode destructif sans validation manuelle** des pages conservées.
2. **Créer les nouveaux registries** avant d'exécuter le nettoyage (ou immédiatement après).
3. **Sauvegarder** : les quarantaines sont dans `_backups/` mais faire un commit avant le nettoyage.
4. **Tester** : après nettoyage, vérifier que `npm run dev:app` et `npm run dev:cp` fonctionnent.

---

**Date :** 2026-01-30  
**Status :** AUDIT COMPLET — PRÊT POUR VALIDATION MANUELLE
