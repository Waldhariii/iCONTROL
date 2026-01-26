# Write Surface Map (report-only)

- Date: 2026-01-26T20:56:44.622Z
- Targets: app/src, modules, platform-services, server
- Missing targets (skipped): none
- Excludes: node_modules, dist, coverage
- Patterns:
  - `\b(?:window\.)?(?:localStorage|sessionStorage)\.(?:setItem|removeItem|clear)\s*\(`
  - `\bdocument\.cookie\s*=`
  - `\bindexedDB\b`
  - `\bfs\.(?:writeFileSync|writeFile|appendFileSync|appendFile|renameSync|rename|rmSync|rm|unlinkSync|unlink)\s*\(`
  - `\bnavigator\.sendBeacon\s*\(`
  - `\baxios\.(?:post|put|patch|delete|request)\s*\(`
  - `\bfetch\s*\(`
- Total hits: 44

## Top Offenders (by file hit count)

- 3 `app/src/pages/cp/ui/loginTheme/loginTheme.override.ts`
- 2 `platform-services/security/auth/localAuth.ts`
- 2 `platform-services/branding/brandService.ts`
- 2 `scripts/cleanup-routing-ssot.sh`
- 2 `scripts/ui-preview.mjs`
- 2 `app/src/__tests__/cp-login.session-scope.contract.test.ts`
- 2 `app/src/localAuth.ts`
- 2 `app/src/__tests__/app-login.session-scope.contract.test.ts`
- 2 `app/src/__tests__/runtime-config-endpoint.shim.flag-on.contract.test.ts`
- 2 `app/src/core/runtime/runtimeConfig.ts`
- 2 `app/src/core/audit/auditLog.ts`
- 2 `app/src/core/entitlements/storage.ts`
- 1 `PHASE_1_15_MARKER.md`
- 1 `modules/core-system/subscription/FileSubscriptionStore.node.ts`
- 1 `app/src/pages/cp/views/users.ts`
- 1 `modules/core-system/ui/frontend-ts/pages/system/sections/health-charts.ts`
- 1 `app/src/pages/cp/dashboard.ts`
- 1 `scripts/gates/gate-ui-contracts.mjs`
- 1 `scripts/gates/gate-ui-component-registry.mjs`
- 1 `app/src/__tests__/subscription-persistence.contract.test.ts`
- 1 `scripts/cp-visual-snap.mjs`
- 1 `scripts/ui-catalog-snap.mjs`
- 1 `app/src/__tests__/runtime-config-endpoint.shim.flag-off-default.contract.test.ts`
- 1 `modules/core-system/ui/frontend-ts/pages/logs/index.ts`
- 1 `app/src/__tests__/runtime-config-endpoint.shim.contract.test.ts`
- 1 `app/src/core/control-plane/storage.ts`
- 1 `app/src/__tests__/auth-cookie.samesite-strict.contract.test.ts`
- 1 `app/src/core/runtime/tenant.ts`
- 1 `app/src/core/runtime/safeMode.ts`
- 1 `app/src/core/ui/themeManager.ts`
- 1 `app/src/core/ui/catalog/index.ts`

## Raw Matches (first 200)

```txt
PHASE_1_15_MARKER.md:8:  - 1x fs.writeFileSync(fp, ...)
platform-services/security/auth/localAuth.ts:120:    localStorage.setItem(LS_SESSION, serialized);
platform-services/security/auth/localAuth.ts:168:  try { localStorage.removeItem(LS_SESSION); } catch (_) {}
platform-services/branding/brandService.ts:159:    window.localStorage.setItem(LS_KEY, serialized);
platform-services/branding/brandService.ts:202:  try { localStorage.removeItem(LS_KEY); } catch {}
modules/core-system/subscription/FileSubscriptionStore.node.ts:98:    fs.writeFileSync(fp, serialized);
app/src/pages/cp/views/users.ts:93:    localStorage.setItem(LS_KEY_SYSTEM_USERS, JSON.stringify(users));
scripts/cleanup-routing-ssot.sh:222:fs.writeFileSync(p, out.join("\n"), "utf8");
scripts/cleanup-routing-ssot.sh:241:  fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n", "utf8");
modules/core-system/ui/frontend-ts/pages/system/sections/health-charts.ts:59:    const res = await fetch("/api/cp/metrics", { headers: { Accept: "application/json" }, signal: ctrl.signal });
app/src/pages/cp/dashboard.ts:379:    const res = await fetch(url, { headers: { "accept": "application/json" } });
scripts/gates/gate-ui-contracts.mjs:72:    fs.writeFileSync(p, s, "utf8");
scripts/gates/gate-ui-component-registry.mjs:121:    fs.writeFileSync(reportPath, content, "utf8");
app/src/pages/cp/ui/loginTheme/loginTheme.override.ts:136:    localStorage.setItem(LS_KEY, JSON.stringify(next));
app/src/pages/cp/ui/loginTheme/loginTheme.override.ts:185:    localStorage.removeItem(LS_KEY);
app/src/pages/cp/ui/loginTheme/loginTheme.override.ts:208:    localStorage.setItem(LS_KEY, JSON.stringify(parsed));
scripts/ui-preview.mjs:325:                localStorage.setItem(sessionKey, JSON.stringify({
scripts/ui-preview.mjs:332:                localStorage.setItem("controlx_settings_v1.theme", theme);
app/src/__tests__/subscription-persistence.contract.test.ts:33:    fs.writeFileSync(fp, "{not-json");
scripts/cp-visual-snap.mjs:152:        localStorage.setItem("icontrol_mgmt_session_v1", JSON.stringify({
scripts/ui-catalog-snap.mjs:163:            localStorage.setItem(
app/src/__tests__/cp-login.session-scope.contract.test.ts:39:      localStorage.removeItem("icontrol_session_v1");
app/src/__tests__/cp-login.session-scope.contract.test.ts:40:      localStorage.removeItem("icontrol_mgmt_session_v1");
app/src/__tests__/runtime-config-endpoint.shim.flag-off-default.contract.test.ts:21:    const res = await fetch("http://localhost/cp/api/runtime-config", {
modules/core-system/ui/frontend-ts/pages/logs/index.ts:343:    const res = await fetch(url, { headers: { "accept": "application/json" } });
app/src/localAuth.ts:90:    document.cookie = cookie;
app/src/localAuth.ts:137:    document.cookie = cookie;
app/src/__tests__/runtime-config-endpoint.shim.contract.test.ts:29:    const res1 = await window.fetch("/something-else", { method: "GET" });
app/src/core/control-plane/storage.ts:51:      window.localStorage.setItem(fullKey, value);
app/src/__tests__/app-login.session-scope.contract.test.ts:39:      localStorage.removeItem("icontrol_session_v1");
app/src/__tests__/app-login.session-scope.contract.test.ts:40:      localStorage.removeItem("icontrol_mgmt_session_v1");
app/src/__tests__/auth-cookie.samesite-strict.contract.test.ts:17:    localStorage.clear();
app/src/__tests__/runtime-config-endpoint.shim.flag-on.contract.test.ts:24:    const res = await fetch("http://localhost/cp/api/runtime-config", {
app/src/__tests__/runtime-config-endpoint.shim.flag-on.contract.test.ts:39:    const res = await fetch("http://localhost/cp/api/runtime-config", {
app/src/core/runtime/tenant.ts:56:  localStorage.setItem(TENANT_KEY, v);
app/src/core/runtime/runtimeConfig.ts:85:    localStorage.setItem(LS_KEY, JSON.stringify(next));
app/src/core/runtime/runtimeConfig.ts:130:    const res = await fetch(`${scope}/api/runtime-config`, {
app/src/core/audit/auditLog.ts:76:  localStorage.setItem(key(), JSON.stringify(trimmed));
app/src/core/audit/auditLog.ts:125:  localStorage.removeItem(key());
app/src/core/entitlements/storage.ts:83:  window.localStorage.setItem(entitlementsKey(tenantId), JSON.stringify(e));
app/src/core/entitlements/storage.ts:119:  window.localStorage.removeItem(entitlementsKey(tenantId));
app/src/core/runtime/safeMode.ts:70:    window.localStorage.setItem(SAFE_KEY, value);
app/src/core/ui/themeManager.ts:262:      localStorage.setItem("icontrol_theme", JSON.stringify(theme));
app/src/core/ui/catalog/index.ts:85:    window.localStorage.setItem("controlx_settings_v1.theme", mode);
```

## Notes
- Report-only: does not block commits.
- Use this list to choose next Write Gateway pilots.
