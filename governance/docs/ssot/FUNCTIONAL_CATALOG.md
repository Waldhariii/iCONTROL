# FUNCTIONAL_CATALOG — catalogues de capacités

**Sources:** `mainSystem.data.ts`, `runtime/configs/module-registry.json`, `moduleLoader.ts`, `router.ts`  
**Généré:** 2026-01-24 (sans CODEX)

## Légende

- **status:** DONE (livré et branché), PARTIAL (partiel), TODO (non livré)
- **quality_level:** 1=minimal, 2=acceptable, 3=production

---

## 1. MAIN_SYSTEM_MODULES

| id | label | type | routes | status | quality_level |
|----|-------|------|--------|--------|---------------|
| CORE_SYSTEM | CORE | core | dashboard, account, parametres, developer, selfcheck | DONE | 2 |
| M_DOSSIERS | DOSSIERS | module | dossiers | DONE | 2 |
| SYSTEM_LOGS | SYSTEME | module | system, logs | DONE | 2 |
| DOCS_OCR | DOCUMENTS | module | docs | TODO | 0 |

---

## 2. module-registry.json

| Module | enabled | type | status |
|--------|---------|------|--------|
| core-system | true | core | DONE |
| dossiers | false | complementary | DONE |
| clients | false | complementary | PARTIAL |
| inventory | false | complementary | TODO |
| documents | false | complementary | TODO |
| ocr | false | complementary | TODO |
| finance | false | complementary | TODO |
| billing | false | complementary | TODO |
| quotes | false | complementary | TODO |
| jobs | false | complementary | TODO |
| calendar | false | complementary | TODO |
| reports | false | complementary | TODO |
| contacts | false | complementary | TODO |
| payments | false | complementary | TODO |
| integrations-hub | false | complementary | PARTIAL |

---

## 3. Contrats transverses

| Contrat | status |
|---------|--------|
| MAIN_SYSTEM_THEME | DONE |
| MAIN_SYSTEM_TABLE_CONTRACT | DONE |
| MAIN_SYSTEM_FORM_CONTRACT | DONE |
| MAIN_SYSTEM_DATASOURCES | PARTIAL |
| MAIN_SYSTEM_RULES | PARTIAL |
| MAIN_SYSTEM_LAYOUT | DONE |

---

## 4. Livrables à compléter

1. **DOCS_OCR:** ajouter #/docs dans getRouteId et moduleLoader.
2. **renderRoute → renderCpPage:** pour tenants, audit, login-theme, subscription, integrations, pages, feature-flags, publish, blocked, notfound (CP).
3. **Modules complementary:** pages ou stubs pour clients, inventory, documents, ocr, etc.
