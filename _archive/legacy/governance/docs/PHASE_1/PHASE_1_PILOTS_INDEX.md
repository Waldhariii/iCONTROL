# Phase 1 Pilots — Index (Shadow; legacy-first; NO-OP)

> Source of truth: code + `app/src/policies/feature_flags.default.json` (tous OFF par défaut).

## Pilots (indicatif)
- runtime_config_shadow → RUNTIME_CONFIG_SET (app/src/core/runtime/runtimeConfig.ts)
- audit_shadow → AUDIT_APPEND (app/src/core/audit/auditLog.ts)
- entitlements_storage_shadow → ENTITLEMENTS_STORAGE_SET (app/src/core/entitlements/storage.ts)
- tenant_shadow → TENANT_SET (app/src/core/runtime/tenant.ts)
- theme_shadow → THEME_SET (app/src/core/ui/themeManager.ts)
- safemode_shadow → SAFEMODE_WRITE_SHADOW (app/src/core/runtime/safeMode.ts)
- cp_storage_shadow → CP_STORAGE_SET (app/src/core/control-plane/storage.ts)
- logintheme_override_shadow → LOGINTHEME_OVERRIDE_WRITE_SHADOW (app/src/pages/cp/ui/loginTheme/loginTheme.override.ts)
- users_shadow → USERS_WRITE_SHADOW (app/src/pages/cp/views/users.ts)
- localauth_shadow → LOCALAUTH_WRITE_SHADOW (platform-services/security/auth/localAuth.ts)
- ui_catalog_shadow → UI_CATALOG_WRITE_SHADOW (app/src/core/ui/catalog/index.ts)
- file_subscription_store_node_fs_shadow → FILESUBSCRIPTIONSTORE_NODE_FS_WRITE_SHADOW (modules/core-system/subscription/FileSubscriptionStore.node.ts)

## Règle d’or
- Aucun flag ON par défaut.
- Aucun double-write: shadow = NO-OP en Phase 1.
