# DATA_NAMESPACE_RULES

**Objectif:** Convention d’isolation des données par tenant.  
**Sources:** `storageNs.ts`, `entitlements/storage.ts`, `tenant.ts`, `auditLog.ts`  
**Généré:** 2026-01-24

## Règle 1 : Clés de stockage

Toute clé de `localStorage` / `sessionStorage` / IndexedDB utilisée par l’app doit être préfixée par un namespace tenant.

- **Pattern:** `icontrol.t.<tenant_id>.<base>` (déjà en place dans `nsKey()`).
- **Exemples:** `icontrol.t.public.auditLog.v1`, `icontrol.t.alpha-hq.entitlements.v1` (via `entitlementsKey(tenantId)`).

## Règle 2 : Entitlements

- **Fonction:** `entitlementsKey(tenantId)` → `icontrol.entitlements.<tenantId>.v1` (ou équivalent selon `storage.ts`).
- Aucune lecture/écriture d’entitlements sans `tenantId` explicite.

## Règle 3 : Audit

- `auditLog` utilise `nsKey("auditLog.v1")` donc `icontrol.t.<tenant_id>.auditLog.v1`.
- Les payloads d’audit doivent inclure `tenant` (ou `tenant_id`) dans le contexte.

## Règle 4 : Tenant par défaut

- `getTenantId()` (cf. `tenant.ts`) : clé `icontrol.runtime.tenantId.v1` ; défaut `"public"` si non défini.
- En multi-tenant, le `tenant_id` doit venir du runtime (claims, header, ou config).

## Règle 5 : Écritures

- Toute écriture (storage, config, toggles) doit passer par le **Write Gateway** (cf. WRITE_GATEWAY_CONTRACT.md) lorsque celui-ci sera en place.
- En attendant : `nsKey` / `entitlementsKey` restent obligatoires pour toute nouvelle clé.

## Fichiers de référence

- `app/src/core/runtime/storageNs.ts` — `nsKey(base)`
- `app/src/core/runtime/tenant.ts` — `getTenantId`, `setTenantId`
- `app/src/core/entitlements/storage.ts` — `entitlementsKey(tenantId)`
- `app/src/core/audit/auditLog.ts` — usage de `nsKey`
