# Write Surface Map (report-only)

- Date: 2026-01-25T21:39:40.695Z
- Targets: app/src, modules, platform-services, server
- Excludes: node_modules, dist, coverage
- Patterns:
  - `\b(localStorage|sessionStorage)\.setItem\s*\(`
  - `\bfs\.(?:writeFileSync|writeFile|appendFile|appendFileSync)\s*\(`
  - `\baxios\.(?:post|put|patch|delete)\s*\(`
  - `\bfetch\s*\([^)]*\bmethod\s*:\s*"(?:POST|PUT|PATCH|DELETE)"`
  - `\b(save|write|persist|upsert|insert|update|delete)[A-Za-z0-9_]*\s*\(`
- Total hits: 115

## Top Offenders (by file hit count)

- 10 `app/src/policies/cache.registry.ts`
- 9 `modules/core-system/ui/frontend-ts/pages/developer/entitlements.tsx`
- 9 `app/src/core/runtime/runtimeConfig.ts`
- 7 `app/src/pages/cp/views/users.ts`
- 5 `modules/core-system/ui/frontend-ts/pages/dossiers/model.ts`
- 5 `app/src/core/entitlements/index.ts`
- 4 `app/src/__tests__/safe-mode.enforcement-wiring.contract.test.ts`
- 4 `app/src/core/ui/themeManager.ts`
- 3 `app/src/pages/cp/ui/loginTheme/loginTheme.override.ts`
- 3 `app/src/core/audit/auditLog.ts`
- 2 `modules/core-system/subscription/SubscriptionRegistry.ts`
- 2 `modules/core-system/subscription/FileSubscriptionStore.node.ts`
- 2 `modules/core-system/subscription/SubscriptionStore.ts`
- 2 `app/src/__tests__/app-cp-guard.app-blocks-cp.contract.test.ts`
- 2 `app/src/__tests__/subscription-persistence.contract.test.ts`
- 2 `app/src/__tests__/app-cp-guard.cp-blocks-app.contract.test.ts`
- 2 `modules/core-system/ui/frontend-ts/pages/activation/index.tsx`
- 2 `app/src/core/ui/dataTable.ts`
- 2 `app/src/core/entitlements/storage.ts`
- 2 `modules/core-system/ui/frontend-ts/pages/system/sections/cache-audit.ts`
- 2 `app/src/core/studio/datasources/router.ts`
- 1 `platform-services/branding/brandService.ts`
- 1 `platform-services/security/auth/localAuth.ts`
- 1 `app/src/pages/cp/login-theme.ts`
- 1 `modules/core-system/subscription/ProviderSync.ts`
- 1 `app/src/__tests__/toolbox.test.ts`
- 1 `app/src/__tests__/access-guard.contract.test.ts`
- 1 `app/src/__tests__/auditlog-entitlements.contract.test.ts`
- 1 `app/src/__tests__/cache-bounds-hardening.contract.test.ts`
- 1 `app/src/__tests__/storage-namespace.contract.test.ts`
- 1 `app/src/__tests__/cp-login.session-scope.contract.test.ts`
- 1 `app/src/__tests__/app-login.session-scope.contract.test.ts`
- 1 `modules/core-system/ui/frontend-ts/pages/account/index.test.ts`
- 1 `app/src/core/control-plane/storage.ts`
- 1 `modules/core-system/ui/frontend-ts/pages/verification/index.test.ts`
- 1 `modules/core-system/ui/frontend-ts/pages/developer/index.test.ts`
- 1 `app/src/core/runtime/tenant.ts`
- 1 `modules/core-system/ui/frontend-ts/pages/dashboard/index.test.ts`
- 1 `app/src/core/runtime/safeMode.ts`
- 1 `modules/core-system/ui/frontend-ts/pages/_shared/safe-mode-write.test.ts`
- 1 `modules/core-system/ui/frontend-ts/pages/settings/branding.test.ts`
- 1 `modules/core-system/ui/frontend-ts/pages/users/index.test.ts`
- 1 `modules/core-system/ui/frontend-ts/pages/_shared/regression-wall.test.ts`
- 1 `modules/core-system/ui/frontend-ts/pages/logs/index.ts`
- 1 `modules/core-system/ui/frontend-ts/pages/logs/index.test.ts`
- 1 `modules/core-system/ui/frontend-ts/pages/dossiers/index.test.ts`
- 1 `modules/core-system/ui/frontend-ts/pages/dossiers/sections/list.ts`
- 1 `modules/core-system/ui/frontend-ts/pages/system/model.ts`
- 1 `modules/core-system/ui/frontend-ts/pages/system/index.test.ts`
- 1 `app/src/localAuth.ts`

## Raw Matches (first 200)

```txt
platform-services/branding/brandService.ts:113:    localStorage.setItem(LS_KEY, JSON.stringify(next));
platform-services/security/auth/localAuth.ts:78:  try { localStorage.setItem(LS_SESSION, JSON.stringify(s)); } catch (_) {}
modules/core-system/subscription/SubscriptionRegistry.ts:27:    await this.store.upsert(rec);
modules/core-system/subscription/SubscriptionRegistry.ts:40:    await this.store.upsert(rec);
app/src/pages/cp/login-theme.ts:289:  const res = saveLoginThemeOverride({ tokens, effects });
modules/core-system/subscription/FileSubscriptionStore.node.ts:57:  async upsert(rec: SubscriptionRecord): Promise<void> {
modules/core-system/subscription/FileSubscriptionStore.node.ts:60:    fs.writeFileSync(fp, JSON.stringify(rec, null, 2) + "\n");
modules/core-system/subscription/SubscriptionStore.ts:5:  upsert(record: SubscriptionRecord): Promise<void>;
modules/core-system/subscription/SubscriptionStore.ts:19:  async upsert(record: SubscriptionRecord): Promise<void> {
app/src/pages/cp/ui/loginTheme/loginTheme.override.ts:96:export function saveLoginThemeOverride(next: CpLoginThemeOverride): { ok: boolean; reason?: string } {
app/src/pages/cp/ui/loginTheme/loginTheme.override.ts:99:    localStorage.setItem(LS_KEY, JSON.stringify(next));
app/src/pages/cp/ui/loginTheme/loginTheme.override.ts:139:    localStorage.setItem(LS_KEY, JSON.stringify(parsed));
modules/core-system/subscription/ProviderSync.ts:21:    await deps.store.upsert(record);
app/src/__tests__/toolbox.test.ts:18:      store.delete(key);
app/src/__tests__/access-guard.contract.test.ts:22:      store.delete(key);
app/src/pages/cp/views/users.ts:47:  saveSystemUsers(defaultUsers);
app/src/pages/cp/views/users.ts:51:function saveSystemUsers(users: SystemUser[]): void {
app/src/pages/cp/views/users.ts:53:    localStorage.setItem(LS_KEY_SYSTEM_USERS, JSON.stringify(users));
app/src/pages/cp/views/users.ts:68:  saveSystemUsers(users);
app/src/pages/cp/views/users.ts:71:function deleteSystemUser(userId: string): void {
app/src/pages/cp/views/users.ts:74:  saveSystemUsers(filtered);
app/src/pages/cp/views/users.ts:279:                deleteSystemUser(user.id);
app/src/__tests__/auditlog-entitlements.contract.test.ts:16:      store.delete(key);
app/src/__tests__/safe-mode.enforcement-wiring.contract.test.ts:7: * We target the studio DataSourceRouter.write(), which is the canonical routing point to ds.write().
app/src/__tests__/safe-mode.enforcement-wiring.contract.test.ts:24:  it("HARD blocks writes (throws ERR_SAFE_MODE_WRITE_BLOCKED)", () => {
app/src/__tests__/safe-mode.enforcement-wiring.contract.test.ts:28:    expect(() => router.write("mem", "k1", "v1")).toThrowError(
app/src/__tests__/safe-mode.enforcement-wiring.contract.test.ts:36:    expect(() => router.write("mem", "k1", "v1")).not.toThrow();
app/src/__tests__/app-cp-guard.app-blocks-cp.contract.test.ts:32:    delete (globalThis as any).__ICONTROL_APP_KIND__;
app/src/__tests__/app-cp-guard.app-blocks-cp.contract.test.ts:33:    delete (globalThis as any).__ICONTROL_LAST_REDIRECT__;
app/src/__tests__/subscription-persistence.contract.test.ts:18:    await store.upsert(rec);
app/src/__tests__/subscription-persistence.contract.test.ts:33:    fs.writeFileSync(fp, "{not-json");
app/src/__tests__/cache-bounds-hardening.contract.test.ts:24:    expect(v2).toBe(1); // cache persistant (no-expiry)
app/src/__tests__/storage-namespace.contract.test.ts:18:      store.delete(key);
app/src/__tests__/app-cp-guard.cp-blocks-app.contract.test.ts:32:    delete (globalThis as any).__ICONTROL_APP_KIND__;
app/src/__tests__/app-cp-guard.cp-blocks-app.contract.test.ts:33:    delete (globalThis as any).__ICONTROL_LAST_REDIRECT__;
app/src/__tests__/cp-login.session-scope.contract.test.ts:17:    delete (window as any).location;
app/src/__tests__/app-login.session-scope.contract.test.ts:17:    delete (window as any).location;
modules/core-system/ui/frontend-ts/pages/account/index.test.ts:17:      store.delete(key);
app/src/core/control-plane/storage.ts:13:      window.localStorage.setItem(this.prefix + key, value);
modules/core-system/ui/frontend-ts/pages/verification/index.test.ts:17:      store.delete(key);
modules/core-system/ui/frontend-ts/pages/developer/entitlements.tsx:18:  function persist(next: Entitlements): void {
modules/core-system/ui/frontend-ts/pages/developer/entitlements.tsx:20:    saveEntitlements(tenantId, next);
modules/core-system/ui/frontend-ts/pages/developer/entitlements.tsx:21:    updateView();
modules/core-system/ui/frontend-ts/pages/developer/entitlements.tsx:57:    persist(next);
modules/core-system/ui/frontend-ts/pages/developer/entitlements.tsx:82:    persist({ ...e, modules: { ...e.modules, [moduleKey]: true } });
modules/core-system/ui/frontend-ts/pages/developer/entitlements.tsx:87:    persist({ ...e, modules: { ...e.modules, [moduleKey]: false } });
modules/core-system/ui/frontend-ts/pages/developer/entitlements.tsx:94:    updateView();
modules/core-system/ui/frontend-ts/pages/developer/entitlements.tsx:135:  function updateView(): void {
modules/core-system/ui/frontend-ts/pages/developer/entitlements.tsx:139:  updateView();
app/src/policies/cache.registry.ts:307:        try { meta.delete(k); } catch {}
app/src/policies/cache.registry.ts:326:    if (lru.has(key)) lru.delete(key);
app/src/policies/cache.registry.ts:359:      try { lru.delete(k); } catch {}
app/src/policies/cache.registry.ts:515:              try { meta.delete(key); } catch {}
app/src/policies/cache.registry.ts:542:              setTimeout(() => { try { meta.delete(key); } catch {} }, Math.min(swr, __CACHE_REFRESH_ASIDE_META_TTL_MS));
app/src/policies/cache.registry.ts:556:                try { __deferMicrotask(() => { try { inflight.delete(key); } catch {} }); } catch {}
app/src/policies/cache.registry.ts:613:              try { meta.delete(key); } catch {}
app/src/policies/cache.registry.ts:634:                setTimeout(() => { try { meta.delete(key); } catch {} }, Math.min(swr, __CACHE_REFRESH_ASIDE_META_TTL_MS));
app/src/policies/cache.registry.ts:648:                  try { __deferMicrotask(() => { try { inflight.delete(key); } catch {} }); } catch {}
app/src/policies/cache.registry.ts:683:      inflight.delete(key);
modules/core-system/ui/frontend-ts/pages/developer/index.test.ts:18:      store.delete(key);
app/src/core/runtime/tenant.ts:56:  localStorage.setItem(TENANT_KEY, v);
modules/core-system/ui/frontend-ts/pages/dashboard/index.test.ts:17:      store.delete(key);
app/src/core/runtime/safeMode.ts:29:  localStorage.setItem(SAFE_KEY, on ? "1" : "0");
modules/core-system/ui/frontend-ts/pages/activation/index.tsx:58:  writeEntitlements(next);
modules/core-system/ui/frontend-ts/pages/activation/index.tsx:79:  writeEntitlements(next);
modules/core-system/ui/frontend-ts/pages/_shared/safe-mode-write.test.ts:18:      store.delete(key);
app/src/core/runtime/runtimeConfig.ts:29:      writeCachedLegacy(cmd.payload as RuntimeConfig);
app/src/core/runtime/runtimeConfig.ts:81:function writeCachedLegacy(next: RuntimeConfig) {
app/src/core/runtime/runtimeConfig.ts:84:    localStorage.setItem(LS_KEY, JSON.stringify(next));
app/src/core/runtime/runtimeConfig.ts:88:function writeCached(next: RuntimeConfig) {
app/src/core/runtime/runtimeConfig.ts:90:    writeCachedLegacy(next);
app/src/core/runtime/runtimeConfig.ts:113:      writeCachedLegacy(next);
app/src/core/runtime/runtimeConfig.ts:122:    writeCachedLegacy(next);
app/src/core/runtime/runtimeConfig.ts:138:    writeCached(json);
app/src/core/runtime/runtimeConfig.ts:142:    writeCached(fallback);
modules/core-system/ui/frontend-ts/pages/settings/branding.test.ts:24:      store.delete(key);
modules/core-system/ui/frontend-ts/pages/users/index.test.ts:17:      store.delete(key);
modules/core-system/ui/frontend-ts/pages/_shared/regression-wall.test.ts:20:      store.delete(key);
modules/core-system/ui/frontend-ts/pages/dossiers/model.ts:49:function writeAll(storage: Storage, rows: Dossier[]): void {
modules/core-system/ui/frontend-ts/pages/dossiers/model.ts:78:  writeAll(storage, rows);
modules/core-system/ui/frontend-ts/pages/dossiers/model.ts:83:export function updateDossier(
modules/core-system/ui/frontend-ts/pages/dossiers/model.ts:109:  writeAll(storage, rows);
modules/core-system/ui/frontend-ts/pages/dossiers/model.ts:149:  writeAll(storage, rows);
modules/core-system/ui/frontend-ts/pages/logs/index.ts:465:    await navigator.clipboard.writeText(text);
modules/core-system/ui/frontend-ts/pages/logs/index.test.ts:19:      store.delete(key);
modules/core-system/ui/frontend-ts/pages/dossiers/index.test.ts:20:      store.delete(key);
modules/core-system/ui/frontend-ts/pages/dossiers/sections/list.ts:40:  else selected.delete(id);
app/src/core/ui/dataTable.ts:207:      updatePagination();
app/src/core/ui/dataTable.ts:214:  function updatePagination(): void {
app/src/core/ui/themeManager.ts:179:    this.saveTheme(theme);
app/src/core/ui/themeManager.ts:225:  updateTokens(updates: Partial<ThemeTokens>): void {
app/src/core/ui/themeManager.ts:258:  private saveTheme(theme: Theme): void {
app/src/core/ui/themeManager.ts:262:      localStorage.setItem("icontrol_theme", JSON.stringify(theme));
modules/core-system/ui/frontend-ts/pages/system/model.ts:47:export function updateFlag(id: string, next: boolean, storage: Storage = window.localStorage): void {
modules/core-system/ui/frontend-ts/pages/system/index.test.ts:17:      store.delete(key);
app/src/localAuth.ts:68:    removeItem: (k: string) => void m.delete(k),
app/src/core/ui/catalog/index.ts:43:    localStorage.setItem("controlx_settings_v1.theme", mode);
app/src/core/audit/auditLog.ts:73:export function writeAuditLog(events: AuditEvent[]) {
app/src/core/audit/auditLog.ts:76:  localStorage.setItem(key(), JSON.stringify(trimmed));
app/src/core/audit/auditLog.ts:84:  writeAuditLog(events);
modules/core-system/ui/frontend-ts/pages/system/sections/flags.ts:17:        onChange: (next) => updateFlag(flag.id, next)
app/src/core/entitlements/index.ts:39:    saveEntitlements(cmd.tenantId, next);
app/src/core/entitlements/index.ts:66:export function writeEntitlements(e: Entitlements): void {
app/src/core/entitlements/index.ts:69:    saveEntitlements(tenantId, e);
app/src/core/entitlements/index.ts:90:      saveEntitlements(tenantId, e);
app/src/core/entitlements/index.ts:99:    saveEntitlements(tenantId, e);
app/src/core/entitlements/storage.ts:80:export function saveEntitlements(tenantId: string, e: Entitlements): void {
app/src/core/entitlements/storage.ts:83:  window.localStorage.setItem(entitlementsKey(tenantId), JSON.stringify(e));
app/src/core/studio/audit/logger.ts:10:      this.sink.write(event);
app/src/core/studio/audit/sinks.ts:7:  write(e: AuditEvent): void {
modules/core-system/ui/frontend-ts/pages/system/sections/cache-audit.ts:21:    await nav.clipboard.writeText(json);
modules/core-system/ui/frontend-ts/pages/system/sections/cache-audit.ts:60:      await nav.clipboard.writeText(text);
app/src/core/studio/datasources/router.ts:35:  write(
app/src/core/studio/datasources/router.ts:59:    return ds.write(key, value);
app/src/core/studio/datasources/memory.ts:12:  function write(key: string, value: JsonValue): DataSourceWriteResult {
```

## Notes
- Report-only: does not block commits.
- Use this list to choose next Write Gateway pilots.
