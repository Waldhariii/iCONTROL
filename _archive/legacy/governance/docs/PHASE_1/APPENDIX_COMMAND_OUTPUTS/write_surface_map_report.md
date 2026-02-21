# Write Surface Map (report-only)

- Date: 2026-01-29T20:52:08.412Z
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
- Total hits: 66

## Top Offenders (by file hit count)

- 14 `server/smoke-runtime-config.mjs`
- 6 `app/_AUDIT_STYLE_SSOT.md`
- 2 `app/tools/scripts/gen-cp-release-notes.mjs`
- 2 `app/src/core/audit/auditLog.ts`
- 2 `platform-services/security/auth/localAuth.ts`
- 2 `app/src/core/entitlements/storage.ts`
- 2 `app/src/core/runtime/runtimeConfig.ts`
- 2 `app/src/__tests__/runtime-config-endpoint.shim.flag-on.contract.test.ts`
- 2 `app/src/localAuth.ts`
- 2 `app/src/__tests__/app-login.session-scope.contract.test.ts`
- 2 `app/src/__tests__/cp-login.session-scope.contract.test.ts`
- 2 `scripts/cleanup-routing-ssot.sh`
- 2 `scripts/ui-preview.mjs`
- 1 `governance/docs/STANDARDS/PHASE_1_15_MARKER.md`
- 1 `modules/core-system/subscription/FileSubscriptionStore.node.ts`
- 1 `app/src/pages/cp/views/users.ts`
- 1 `app/src/core/control-plane/storage.ts`
- 1 `app/src/pages/cp/dashboard.ts`
- 1 `app/src/dev/showcase.ts`
- 1 `app/tools/scripts/build-cp-bundle.sh`
- 1 `app/src/__tests__/subscription-persistence.contract.test.ts`
- 1 `app/tools/scripts/gen-devonly-routes-doc.mjs`
- 1 `app/src/__tests__/runtime-config-endpoint.shim.flag-off-default.contract.test.ts`
- 1 `modules/core-system/ui/frontend-ts/pages/logs/index.ts`
- 1 `app/src/__tests__/runtime-config-endpoint.shim.contract.test.ts`
- 1 `app/src/core/runtime/tenant.ts`
- 1 `app/src/core/runtime/safeMode.ts`
- 1 `modules/core-system/ui/frontend-ts/pages/system/sections/health-charts.ts`
- 1 `app/src/core/ui/themeManager.ts`
- 1 `app/src/__tests__/auth-cookie.samesite-strict.contract.test.ts`
- 1 `app/src/core/ui/catalog/index.ts`
- 1 `scripts/gates/gate-ui-component-registry.mjs`
- 1 `scripts/cp-visual-snap.mjs`
- 1 `scripts/ui-catalog-snap.mjs`
- 1 `scripts/gates/gate-ui-contracts.mjs`

## Raw Matches (first 200)

```txt
governance/docs/STANDARDS/PHASE_1_15_MARKER.md:8:  - 1x fs.writeFileSync(fp, ...)
modules/core-system/subscription/FileSubscriptionStore.node.ts:35:    fs.writeFileSync(this.filePath, JSON.stringify(arr, null, 2), "utf8");
app/src/pages/cp/views/users.ts:94:    localStorage.setItem(LS_KEY_SYSTEM_USERS, JSON.stringify(users));
app/src/core/control-plane/storage.ts:51:      window.localStorage.setItem(fullKey, value);
app/_AUDIT_STYLE_SSOT.md:474:src/core/ui/themeManager.ts:262:      localStorage.setItem("icontrol_theme", JSON.stringify(theme));
app/_AUDIT_STYLE_SSOT.md:505:src/core/ui/catalog/index.ts.bak_20260128_155413:85:    window.localStorage.setItem("icontrol_settings_v1.theme", mode);
app/_AUDIT_STYLE_SSOT.md:530:src/core/ui/catalog/index.ts.bak_controlx_20260128_150958:85:    window.localStorage.setItem("controlx_settings_v1.theme", mode);
app/_AUDIT_STYLE_SSOT.md:557:src/core/ui/catalog/index.ts:85:    window.localStorage.setItem("icontrol_settings_v1.theme", mode);
app/_AUDIT_STYLE_SSOT.md:960:src/core/entitlements/storage.ts:83:  window.localStorage.setItem(entitlementsKey(tenantId), JSON.stringify(e));
app/_AUDIT_STYLE_SSOT.md:966:src/core/entitlements/storage.ts:119:  window.localStorage.removeItem(entitlementsKey(tenantId));
app/src/pages/cp/dashboard.ts:380:    const res = await fetch(url, { headers: { "accept": "application/json" } });
app/src/dev/showcase.ts:176:          <div style="opacity:.75">Activation: <code>localStorage.setItem("icontrol_showcase","1")</code> puis refresh.</div>
server/smoke-runtime-config.mjs:40:// Uses local fetch() function defined below
server/smoke-runtime-config.mjs:45:      const r = await fetch(`${baseUrl}/api/health`);
server/smoke-runtime-config.mjs:139:function fetch(url, options = {}) {
server/smoke-runtime-config.mjs:193:      const r = await fetch(`${currentBaseUrl}/api/health`);
server/smoke-runtime-config.mjs:211:      const r = await fetch(`${currentBaseUrl}/healthz`);
server/smoke-runtime-config.mjs:229:      const res = await fetch(`${currentBaseUrl}/app/api/runtime-config`);
server/smoke-runtime-config.mjs:248:      const res = await fetch(`${currentBaseUrl}/cp/api/runtime-config`);
server/smoke-runtime-config.mjs:268:        const res = await fetch(`${currentBaseUrl}/app/api/route-catalog`);
server/smoke-runtime-config.mjs:292:        const res = await fetch(`${currentBaseUrl}/app/api/route-catalog`);
server/smoke-runtime-config.mjs:310:        const res = await fetch(`${currentBaseUrl}/cp/api/route-catalog`);
server/smoke-runtime-config.mjs:334:        const res = await fetch(`${currentBaseUrl}/cp/api/route-catalog`);
server/smoke-runtime-config.mjs:355:        const res = await fetch(`${currentBaseUrl}/app/`);
server/smoke-runtime-config.mjs:376:        const res = await fetch(`${currentBaseUrl}/app/does-not-exist`);
server/smoke-runtime-config.mjs:394:      const res = await fetch(`${currentBaseUrl}/`, { method: "GET", followRedirect: false });
app/tools/scripts/build-cp-bundle.sh:75:fs.writeFileSync(out, JSON.stringify(manifest, null, 2) + "\n");
app/tools/scripts/gen-cp-release-notes.mjs:84:fs.writeFileSync(relPath, lines.join("\n") + "\n");
app/tools/scripts/gen-cp-release-notes.mjs:120:fs.writeFileSync(provPath, prov.join("\n") + "\n");
app/src/__tests__/subscription-persistence.contract.test.ts:33:    fs.writeFileSync(fp, "{not-json");
app/tools/scripts/gen-devonly-routes-doc.mjs:83:  fs.writeFileSync(OUT, md);
app/src/core/audit/auditLog.ts:76:  localStorage.setItem(key(), JSON.stringify(trimmed));
app/src/core/audit/auditLog.ts:125:  localStorage.removeItem(key());
platform-services/security/auth/localAuth.ts:120:    localStorage.setItem(LS_SESSION, serialized);
platform-services/security/auth/localAuth.ts:168:  try { localStorage.removeItem(LS_SESSION); } catch (_) {}
app/src/core/entitlements/storage.ts:83:  window.localStorage.setItem(entitlementsKey(tenantId), JSON.stringify(e));
app/src/core/entitlements/storage.ts:119:  window.localStorage.removeItem(entitlementsKey(tenantId));
app/src/__tests__/runtime-config-endpoint.shim.flag-off-default.contract.test.ts:21:    const res = await fetch("http://localhost/cp/api/runtime-config", {
modules/core-system/ui/frontend-ts/pages/logs/index.ts:343:    const res = await fetch(url, { headers: { "accept": "application/json" } });
app/src/__tests__/runtime-config-endpoint.shim.contract.test.ts:29:    const res1 = await window.fetch("/something-else", { method: "GET" });
app/src/core/runtime/tenant.ts:56:  localStorage.setItem(TENANT_KEY, v);
app/src/core/runtime/safeMode.ts:70:    window.localStorage.setItem(SAFE_KEY, value);
app/src/core/runtime/runtimeConfig.ts:85:    localStorage.setItem(LS_KEY, JSON.stringify(next));
app/src/core/runtime/runtimeConfig.ts:130:    const res = await fetch(`${scope}/api/runtime-config`, {
modules/core-system/ui/frontend-ts/pages/system/sections/health-charts.ts:59:    const res = await fetch("/api/cp/metrics", { headers: { Accept: "application/json" }, signal: ctrl.signal });
app/src/__tests__/runtime-config-endpoint.shim.flag-on.contract.test.ts:24:    const res = await fetch("http://localhost/cp/api/runtime-config", {
app/src/__tests__/runtime-config-endpoint.shim.flag-on.contract.test.ts:39:    const res = await fetch("http://localhost/cp/api/runtime-config", {
app/src/localAuth.ts:90:    document.cookie = cookie;
app/src/localAuth.ts:137:    document.cookie = cookie;
app/src/__tests__/app-login.session-scope.contract.test.ts:44:      localStorage.removeItem("icontrol_session_v1");
app/src/__tests__/app-login.session-scope.contract.test.ts:45:      localStorage.removeItem("icontrol_mgmt_session_v1");
app/src/core/ui/themeManager.ts:262:      localStorage.setItem("icontrol_theme", JSON.stringify(theme));
app/src/__tests__/auth-cookie.samesite-strict.contract.test.ts:17:    localStorage.clear();
app/src/core/ui/catalog/index.ts:85:    window.localStorage.setItem("icontrol_settings_v1.theme", mode);
app/src/__tests__/cp-login.session-scope.contract.test.ts:39:      localStorage.removeItem("icontrol_session_v1");
app/src/__tests__/cp-login.session-scope.contract.test.ts:40:      localStorage.removeItem("icontrol_mgmt_session_v1");
scripts/cleanup-routing-ssot.sh:222:fs.writeFileSync(p, out.join("\n"), "utf8");
scripts/cleanup-routing-ssot.sh:241:  fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n", "utf8");
scripts/ui-preview.mjs:325:                localStorage.setItem(sessionKey, JSON.stringify({
scripts/ui-preview.mjs:332:                localStorage.setItem("icontrol_settings_v1.theme", theme);
scripts/gates/gate-ui-component-registry.mjs:121:    fs.writeFileSync(reportPath, content, "utf8");
scripts/cp-visual-snap.mjs:152:        localStorage.setItem("icontrol_mgmt_session_v1", JSON.stringify({
scripts/ui-catalog-snap.mjs:163:            localStorage.setItem(
scripts/gates/gate-ui-contracts.mjs:72:    fs.writeFileSync(p, s, "utf8");
```

## Notes
- Report-only: does not block commits.
- Use this list to choose next Write Gateway pilots.
