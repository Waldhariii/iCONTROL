# Write Gateway Coverage Report (heuristic)

- Date: 2026-01-25T20:36:52.278Z
- Targets: `app/src/core`, `modules`
- Excludes: `app/src/core/write-gateway`
- Pattern: `\\b(save|write)[A-Za-z0-9_]*\\s*\\(|localStorage\\.setItem\\s*\\(|sessionStorage\\.setItem\\s*\\(`
- Hits: 37

## Findings (first 200)

```txt
app/src/core/control-plane/storage.ts:13:      window.localStorage.setItem(this.prefix + key, value);
modules/core-system/subscription/FileSubscriptionStore.node.ts:60:    fs.writeFileSync(fp, JSON.stringify(rec, null, 2) + "\n");
app/src/core/runtime/tenant.ts:20:  localStorage.setItem(TENANT_KEY, v);
app/src/core/audit/auditLog.ts:37:export function writeAuditLog(events: AuditEvent[]) {
app/src/core/audit/auditLog.ts:40:  localStorage.setItem(key(), JSON.stringify(trimmed));
app/src/core/audit/auditLog.ts:47:  writeAuditLog(events);
app/src/core/entitlements/index.ts:39:    saveEntitlements(cmd.tenantId, next);
app/src/core/entitlements/index.ts:66:export function writeEntitlements(e: Entitlements): void {
app/src/core/entitlements/index.ts:69:    saveEntitlements(tenantId, e);
app/src/core/entitlements/index.ts:90:      saveEntitlements(tenantId, e);
app/src/core/entitlements/index.ts:99:    saveEntitlements(tenantId, e);
modules/core-system/ui/frontend-ts/pages/logs/index.ts:465:    await navigator.clipboard.writeText(text);
app/src/core/runtime/runtimeConfig.ts:44:function writeCached(next: RuntimeConfig) {
app/src/core/runtime/runtimeConfig.ts:47:    localStorage.setItem(LS_KEY, JSON.stringify(next));
app/src/core/runtime/runtimeConfig.ts:63:    writeCached(json);
app/src/core/runtime/runtimeConfig.ts:67:    writeCached(fallback);
app/src/core/ui/themeManager.ts:144:    this.saveTheme(theme);
app/src/core/ui/themeManager.ts:223:  private saveTheme(theme: Theme): void {
app/src/core/ui/themeManager.ts:227:      localStorage.setItem("icontrol_theme", JSON.stringify(theme));
app/src/core/entitlements/storage.ts:45:export function saveEntitlements(tenantId: string, e: Entitlements): void {
app/src/core/entitlements/storage.ts:48:  window.localStorage.setItem(entitlementsKey(tenantId), JSON.stringify(e));
app/src/core/runtime/safeMode.ts:29:  localStorage.setItem(SAFE_KEY, on ? "1" : "0");
app/src/core/ui/catalog/index.ts:43:    localStorage.setItem("controlx_settings_v1.theme", mode);
modules/core-system/ui/frontend-ts/pages/activation/index.tsx:58:  writeEntitlements(next);
modules/core-system/ui/frontend-ts/pages/activation/index.tsx:79:  writeEntitlements(next);
modules/core-system/ui/frontend-ts/pages/developer/entitlements.tsx:20:    saveEntitlements(tenantId, next);
modules/core-system/ui/frontend-ts/pages/dossiers/model.ts:49:function writeAll(storage: Storage, rows: Dossier[]): void {
modules/core-system/ui/frontend-ts/pages/dossiers/model.ts:78:  writeAll(storage, rows);
modules/core-system/ui/frontend-ts/pages/dossiers/model.ts:109:  writeAll(storage, rows);
modules/core-system/ui/frontend-ts/pages/dossiers/model.ts:149:  writeAll(storage, rows);
modules/core-system/ui/frontend-ts/pages/system/sections/cache-audit.ts:21:    await nav.clipboard.writeText(json);
modules/core-system/ui/frontend-ts/pages/system/sections/cache-audit.ts:60:      await nav.clipboard.writeText(text);
app/src/core/studio/audit/sinks.ts:7:  write(e: AuditEvent): void {
app/src/core/studio/audit/logger.ts:10:      this.sink.write(event);
app/src/core/studio/datasources/memory.ts:12:  function write(key: string, value: JsonValue): DataSourceWriteResult {
app/src/core/studio/datasources/router.ts:35:  write(
app/src/core/studio/datasources/router.ts:59:    return ds.write(key, value);
```

## Notes
- Report-only: does not block commits.
- Heuristic may include false positives; migrate to WriteGateway as you touch these paths.
