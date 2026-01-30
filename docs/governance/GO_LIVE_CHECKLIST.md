# GO_LIVE_CHECKLIST — Complétude avant commercialisation

Checklist **bloquante** : toutes les cases doivent être cochées et auditées avant mise en production / commercialisation.

---

## 1. Catalogue et gouvernance des routes

- [ ] **Toutes les pages sont cataloguées**  
  - ROUTE_CATALOG.json à jour et versionné  
  - PAGE_INVENTORY.md à jour  
  - Aucune route servie en dehors du catalogue  

- [ ] **Aucune route hors SSOT**  
  - ROUTE_DRIFT_REPORT.md vert (aucune page non déclarée)  
  - Gate CI ROUTE_DRIFT ou équivalent : PASS  

---

## 2. Catalogue fonctionnel

- [ ] **Toutes les capacités sont classifiées**  
  - FUNCTIONAL_CATALOG.md à jour  
  - CAPABILITY_STATUS.json à jour (status, quality_level)  
  - TECH_DEBT_CAPABILITIES.md revu ; pas de capability « fantôme » non cataloguée  

---

## 3. Matrice tenant

- [ ] **Tous les tenants ont une matrice valide**  
  - TENANT_FEATURE_MATRIX.json (ou équivalent par plan) à jour  
  - TENANT_TEMPLATES.json (Free, Pro, Enterprise) définis  
  - Guard backend : refus de toute activation non déclarée dans la matrice  
  - TENANT_DRIFT_AUDIT.log (ou équivalent) consulté ; pas d'anomalie bloquante  

---

## 4. Design System

- [ ] **Design System verrouillé**  
  - DESIGN_SYSTEM_SSOT.md à jour  
  - design.tokens.json à jour  
  - ADMIN_COMPONENTS_REGISTRY.ts à jour  
  - UI_DRIFT_REPORT.md vert (ou gate UI_DRIFT : PASS)  
  - Aucune page Admin hors tokens / composants officiels  

---

## 5. Isolation opérationnelle

- [ ] **Aucune écriture hors gateway**  
  - WRITE_GATEWAY_CONTRACT.md respecté  
  - 0 écriture directe (localStorage, config, etc.) en dehors du Write Gateway  
  - DATA_NAMESPACE_RULES.md respecté (tenant_id/*)  

- [ ] **Snapshot / rollback**  
  - SNAPSHOT_ROLLBACK_POLICY.md en vigueur  
  - Snapshot avant mutations critiques  
  - Rollback obligatoire testé sur chaque release  

---

## 6. Isolation des modules de pages

- [ ] **Aucune dépendance page↔page**  
  - PAGE_MODULE_RULES.md respecté  
  - PAGE_BOUNDARY_LINT_RULES (ou gate) : PASS  
  - PAGE_ISOLATION_REPORT.md vert  
  - 1 page = 1 module isolé ; lazy-load ; communication via contracts/events  

---

## 7. Sécurité et gouvernance

- [ ] **Audit security + governance GREEN**  
  - Security gate : PASS  
  - SSOT / duplicates / artefacts : PASS  
  - Boundaries (imports) : PASS  
  - Admin / Client route gates : PASS  
  - UIDriftGate : PASS  
  - Smoke (build + render minimal) : PASS  
  - Aucune régression security non résolue  

---

## Validation

| Date       | Validant | Signature / Référence |
|------------|----------|------------------------|
|            |          |                        |

---

*Référence : Bloc « Compléments critiques », section 7 — Checklist de complétude avant commercialisation.*
