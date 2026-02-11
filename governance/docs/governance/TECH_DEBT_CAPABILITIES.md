# TECH_DEBT_CAPABILITIES

**Sources:** FUNCTIONAL_CATALOG, CAPABILITY_STATUS, module-registry, mainSystem.data  
**Généré:** 2026-01-24

## Dette par capability

| Capability | Dette | Priorité |
|------------|-------|----------|
| DOCS_OCR | Route #/docs absente de getRouteId et moduleLoader | P2 |
| clients (module-registry) | Pas de page dédiée, pas de route | P3 |
| integrations-hub | cp.integrations en registry, allowlist OK ; dépendance config | P2 |
| renderRoute | Imports statiques login/dashboard/settings/settings_branding (non lazy) | P3 |
| MAIN_SYSTEM « parametres » | Alias vers settings ; « selfcheck » non exposé | P3 |
| PAGE→PAGE | Risque d'imports page→page ; PAGE_BOUNDARY_LINT à faire | P2 |
| Write Gateway | Écritures (storage, toggles, config) non passées par une façade unique | P1 |
| TENANT_FEATURE_MATRIX | Non branché dans entitlements / guard (Phase 2.3–2.4) | P2 |

## Dette transversale

- **SAFE_MODE / audit :** écritures partiellement gardées ; à centraliser dans Write Gateway.
- **storageNs / entitlementsKey :** conventions présentes (storageNs, entitlements) ; à formaliser dans DATA_NAMESPACE_RULES.
