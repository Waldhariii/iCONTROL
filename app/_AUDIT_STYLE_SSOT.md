# AUDIT STYLE SSOT — iCONTROL/app

Date: jeu. 29 janv. 2026 10:24:32 EST
Repo: /Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/app

## A) Imports CSS (src)
src/main.ts.bak.20260128_142906:1:import "./styles/tokens.generated.css";
src/main.ts.bak.20260128_142906:3:import "./styles/STYLE_ADMIN_FINAL.css";
src/main.ts.bak_20260128_165957.bak_20260128_165957:1:import "./styles/tokens.generated.css";
src/main.ts.bak_20260128_165957.bak_20260128_165957:3:import "./styles/STYLE_ADMIN_FINAL.css";
src/main.ts.bak_20260128_163524.bak_20260128_165957:1:import "./styles/tokens.generated.css";
src/main.ts.bak_20260128_163524.bak_20260128_165957:3:import "./styles/STYLE_ADMIN_FINAL.css";
src/main.ts.bak_20260128_163524:1:import "./styles/tokens.generated.css";
src/main.ts.bak_20260128_163524:3:import "./styles/STYLE_ADMIN_FINAL.css";
src/main.ts.bak_20260128_160637.bak_20260128_165957:1:import "./styles/tokens.generated.css";
src/main.ts.bak_20260128_160637.bak_20260128_165957:3:import "./styles/STYLE_ADMIN_FINAL.css";
src/main.ts:1:import "./styles/tokens.generated.css";
src/main.ts:3:import "./styles/STYLE_ADMIN_FINAL.css";
src/main.ts.bak.20260128_142710:1:import "./styles/tokens.generated.css";
src/main.ts.bak.20260128_142710:3:import "./styles/STYLE_ADMIN_FINAL.css";
src/main.ts.bak_20260128_170444:1:import "./styles/tokens.generated.css";
src/main.ts.bak_20260128_170444:3:import "./styles/STYLE_ADMIN_FINAL.css";
src/pages/app/client-disabled.ts:1:/* import "./client-foundation.css"; — désactivé: styles visuels retirés */
src/main.ts.bak_20260128_160637:1:import "./styles/tokens.generated.css";
src/main.ts.bak_20260128_160637:3:import "./styles/STYLE_ADMIN_FINAL.css";
src/main.ts.bak.20260128_142420:1:import "./styles/tokens.generated.css";
src/main.ts.bak.20260128_142420:3:import "./styles/STYLE_ADMIN_FINAL.css";
src/main.ts.bak_20260128_165957:1:import "./styles/tokens.generated.css";
src/main.ts.bak_20260128_165957:3:import "./styles/STYLE_ADMIN_FINAL.css";
src/pages/app/client-access-denied.ts:1:/* import "./client-foundation.css"; — désactivé: styles visuels retirés */
src/pages/app/client-catalog.ts:1:/* import "./client-foundation.css"; — désactivé: styles visuels retirés */

## B) Liste fichiers CSS/SCSS
src/pages/app/client-foundation.css
src/styles/STYLE_ADMIN_FINAL.css
src/styles/STYLE_CLIENT_FINAL.css
src/styles/tokens.generated.css

## C) Indices tokens/thème (variables CSS / theme)
src/router.ts.bak.20260128_130337:194:    if (seg === "login-theme") return "login_theme_cp";
src/main.ts.bak_20260128_165957:1:import "./styles/tokens.generated.css";
src/main.ts.bak_20260128_165957:122:/* ICONTROL_THEME_BOOTSTRAP_V1 — SSOT tokens -> CSS vars (generated) */
src/main.ts.bak_20260128_165957:137:    const themeId = kind === "CP" ? "cp-dashboard-charcoal" : "app-foundation-slate";
src/main.ts.bak_20260128_165957:138:    const themeMode = "dark";
src/main.ts.bak_20260128_165957:139:    root.dataset.icThemeId = themeId;
src/main.ts.bak_20260128_165957:140:    root.dataset.icThemeMode = themeMode;
src/main.ts.bak_20260128_165957:308: * 4. queueMicrotask: theme, versionGate, bootRouter → première route.
src/router.ts.bak.20260128_130449:194:    if (seg === "login-theme") return "login_theme_cp";
src/router.ts.bak.20260128_132152:243:    if (seg === "login-theme") return "login_theme_cp";
src/router.ts.bak.20260128_130548:194:    if (seg === "login-theme") return "login_theme_cp";
src/router.ts.bak.20260128_142135:243:    if (seg === "login-theme") return "login_theme_cp";
src/pages/dashboard.ts.disabled:12:        <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06)">
src/pages/dashboard.ts.disabled:16:        <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06)">
src/pages/dashboard.ts.disabled:20:        <div style="padding:14px;border-radius:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06)">
src/policies/feature_flags.default.json:18:    "theme_shadow": {
src/policies/feature_flags.default.json:24:    "logintheme_override_shadow": {
src/main.ts.bak_20260128_163524.bak_20260128_165957:1:import "./styles/tokens.generated.css";
src/main.ts.bak_20260128_163524.bak_20260128_165957:122:/* ICONTROL_THEME_BOOTSTRAP_V1 — SSOT tokens -> CSS vars (generated) */
src/main.ts.bak_20260128_163524.bak_20260128_165957:137:    const themeId = kind === "CP" ? "cp-dashboard-charcoal" : "app-foundation-slate";
src/main.ts.bak_20260128_163524.bak_20260128_165957:138:    const themeMode = "dark";
src/main.ts.bak_20260128_163524.bak_20260128_165957:139:    root.dataset.icThemeId = themeId;
src/main.ts.bak_20260128_163524.bak_20260128_165957:140:    root.dataset.icThemeMode = themeMode;
src/main.ts.bak_20260128_163524.bak_20260128_165957:307: * 4. queueMicrotask: theme, versionGate, bootRouter → première route.
src/main.ts.bak.20260128_142906:1:import "./styles/tokens.generated.css";
src/main.ts.bak.20260128_142906:122:/* ICONTROL_THEME_BOOTSTRAP_V1 — SSOT tokens -> CSS vars (generated) */
src/main.ts.bak.20260128_142906:137:    const themeId = kind === "CP" ? "cp-dashboard-charcoal" : "app-foundation-slate";
src/main.ts.bak.20260128_142906:138:    const themeMode = "dark";
src/main.ts.bak.20260128_142906:139:    root.dataset.icThemeId = themeId;
src/main.ts.bak.20260128_142906:140:    root.dataset.icThemeMode = themeMode;
src/main.ts.bak.20260128_142906:307: * 4. queueMicrotask: theme, versionGate, bootRouter → première route.
src/router.ts.bak.20260128_141916:243:    if (seg === "login-theme") return "login_theme_cp";
src/router.ts.bak.20260128_131638:226:    if (seg === "login-theme") return "login_theme_cp";
src/router.ts.bak.20260128_132100:226:    if (seg === "login-theme") return "login_theme_cp";
src/policies/audit.redact.ts:5:// - Heuristic detection on values (bearer tokens, jwt-like, api keys)
src/main.ts.bak_20260128_163524:1:import "./styles/tokens.generated.css";
src/main.ts.bak_20260128_163524:122:/* ICONTROL_THEME_BOOTSTRAP_V1 — SSOT tokens -> CSS vars (generated) */
src/main.ts.bak_20260128_163524:137:    const themeId = kind === "CP" ? "cp-dashboard-charcoal" : "app-foundation-slate";
src/main.ts.bak_20260128_163524:138:    const themeMode = "dark";
src/main.ts.bak_20260128_163524:139:    root.dataset.icThemeId = themeId;
src/main.ts.bak_20260128_163524:140:    root.dataset.icThemeMode = themeMode;
src/main.ts.bak_20260128_163524:307: * 4. queueMicrotask: theme, versionGate, bootRouter → première route.
src/pages/cp/registry.ts.bak.20260128_125810:132:  login_theme_cp: {
src/pages/cp/registry.ts.bak.20260128_125810:134:    routeId: "login_theme_cp",
src/pages/cp/registry.ts.bak.20260128_125810:135:    // NOTE: page_module_id = cp.login_theme (ROUTE_CATALOG SSOT)
src/pages/cp/registry.ts.bak.20260128_125810:137:      const mod = await import("./login-theme");
src/pages/cp/registry.ts.bak.20260128_125933:132:  login_theme_cp: {
src/pages/cp/registry.ts.bak.20260128_125933:134:    routeId: "login_theme_cp",
src/pages/cp/registry.ts.bak.20260128_125933:135:    // NOTE: page_module_id = cp.login_theme (ROUTE_CATALOG SSOT)
src/pages/cp/registry.ts.bak.20260128_125933:137:      const mod = await import("./login-theme");
src/pages/cp/login-theme.ts:3: * Objectif: page de configuration du branding de login (tokens, logo, fond, CTA)
src/pages/cp/login-theme.ts:36:      "Configuration du branding multi-tenant pour l’écran de login (tokens, logo, fond, CTA)."
src/pages/cp/login-theme.ts:56:      h("li", {}, "Éditeur de tokens (design.tokens scope cp.login_theme)"),
src/pages/cp/settings.ts:35:  brandingLink.style.cssText = "display:inline-block;margin-top:12px;padding:8px 16px;background:var(--ic-accent, #4ec9b0);color:white;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;";
src/pages/cp/settings.ts:52:  systemLink.style.cssText = "display:inline-block;margin-top:12px;padding:8px 16px;background:var(--ic-accent, #4ec9b0);color:white;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;";
src/router.ts.bak.20260128_125000:195:    if (seg === "login-theme") return "login_theme_cp";
src/router.ts.bak.20260128_131021:194:    if (seg === "login-theme") return "login_theme_cp";
src/pages/cp/login.ts:11:  `max-width:520px;margin:40px auto;padding:24px;border-radius:18px;` +
src/pages/cp/login.ts:15:  "width:100%;padding:12px 14px;border-radius:12px;border:1px solid var(--ic-border, #333);" +
src/pages/cp/login.ts:19:  "width:100%;padding:12px 14px;border-radius:12px;border:none;" +
src/pages/cp/login.ts:89:            <select id="login-lang" style="background:var(--ic-panel, #222);color:var(--ic-text, #fff);border:1px solid var(--ic-border, #333);padding:6px 10px;border-radius:8px;font-size:12px;cursor:pointer;">
src/styles/tokens.generated.css:2: * Source: config/ssot/design.tokens.json
src/styles/tokens.generated.css:3: * Run: node scripts/gates/generate-design-tokens-css.mjs
src/styles/tokens.generated.css:5::root {
src/styles/tokens.generated.css:6:  --app-bg-primary: #0f1115;
src/styles/tokens.generated.css:7:  --app-bg-secondary: #0a0c10;
src/styles/tokens.generated.css:8:  --app-bg-gradient: radial-gradient(1200px 700px at 18% 12%, rgba(255,255,255,0.05), transparent 60%), radial-gradient(900px 600px at 85% 25%, rgba(56,189,248,0.08), transparent 58%), linear-gradient(180deg, #0f1115 0%, #0a0c10 55%, #07080a 100%);
src/styles/tokens.generated.css:9:  --surface-0: linear-gradient(180deg, rgba(40,42,48,0.92), rgba(28,30,36,0.92));
src/styles/tokens.generated.css:10:  --surface-1: linear-gradient(180deg, rgba(34,36,42,0.86), rgba(24,26,32,0.86));
src/styles/tokens.generated.css:11:  --surface-border: rgba(255,255,255,0.08);
src/styles/tokens.generated.css:12:  --text-primary: #e6e8ee;
src/styles/tokens.generated.css:13:  --text-muted: rgba(148,163,184,0.85);
src/styles/tokens.generated.css:14:  --accent-primary: rgba(56,189,248,0.9);
src/styles/tokens.generated.css:15:  --accent-glow: rgba(56,189,248,0.25);
src/styles/tokens.generated.css:16:  --shadow-md: 0 18px 46px rgba(0,0,0,0.45);
src/styles/tokens.generated.css:17:  --shadow-lg: 0 26px 70px rgba(0,0,0,0.55);
src/styles/tokens.generated.css:20::root[data-ic-theme-id="cp-dashboard-charcoal"][data-ic-theme-mode="dark"] {
src/styles/tokens.generated.css:21:  --app-bg-primary: #0c0f12;
src/styles/tokens.generated.css:22:  --app-bg-secondary: #12161b;
src/styles/tokens.generated.css:23:  --app-bg-gradient: #0c0f12;
src/styles/tokens.generated.css:24:  --surface-0: #151a1f;
src/styles/tokens.generated.css:25:  --surface-1: #171c22;
src/styles/tokens.generated.css:26:  --surface-border: #262d35;
src/styles/tokens.generated.css:27:  --text-primary: #e6e9ee;
src/styles/tokens.generated.css:28:  --text-muted: #9aa3ad;
src/styles/tokens.generated.css:29:  --accent-primary: #5a8fff;
src/styles/tokens.generated.css:30:  --accent-glow: rgba(90,143,255,0.25);
src/styles/tokens.generated.css:31:  --shadow-md: 0 4px 14px rgba(0,0,0,0.28);
src/styles/tokens.generated.css:32:  --shadow-lg: 0 8px 22px rgba(0,0,0,0.32);
src/styles/tokens.generated.css:33:  --cp-login-page-bg: var(--app-bg-primary);
src/styles/tokens.generated.css:34:  --cp-login-panel-bg: var(--surface-0);
src/styles/tokens.generated.css:35:  --cp-login-card-bg: var(--surface-1);
src/styles/tokens.generated.css:36:  --cp-login-input-bg: #101419;
src/styles/tokens.generated.css:37:  --cp-login-button-bg: var(--accent-primary);
src/styles/tokens.generated.css:40::root[data-ic-theme-id="app-foundation-slate"][data-ic-theme-mode="dark"] {
src/styles/tokens.generated.css:41:  --app-bg-primary: #0f1115;
src/styles/tokens.generated.css:42:  --app-bg-secondary: #0a0c10;
src/styles/tokens.generated.css:43:  --app-bg-gradient: radial-gradient(1200px 700px at 18% 12%, rgba(255,255,255,0.05), transparent 60%), radial-gradient(900px 600px at 85% 25%, rgba(56,189,248,0.08), transparent 58%), linear-gradient(180deg, #0f1115 0%, #0a0c10 55%, #07080a 100%);
src/styles/tokens.generated.css:44:  --surface-0: linear-gradient(180deg, rgba(40,42,48,0.92), rgba(28,30,36,0.92));
src/styles/tokens.generated.css:45:  --surface-1: linear-gradient(180deg, rgba(34,36,42,0.86), rgba(24,26,32,0.86));
src/styles/tokens.generated.css:46:  --surface-border: rgba(255,255,255,0.08);
src/styles/tokens.generated.css:47:  --text-primary: #e6e8ee;
src/styles/tokens.generated.css:48:  --text-muted: rgba(148,163,184,0.85);
src/styles/tokens.generated.css:49:  --accent-primary: rgba(56,189,248,0.9);
src/styles/tokens.generated.css:50:  --accent-glow: rgba(56,189,248,0.25);
src/styles/tokens.generated.css:51:  --shadow-md: 0 18px 46px rgba(0,0,0,0.45);
src/styles/tokens.generated.css:52:  --shadow-lg: 0 26px 70px rgba(0,0,0,0.55);
src/styles/tokens.generated.css:55::root[data-ic-theme-id="app-foundation-slate"][data-ic-theme-mode="light"] {
src/styles/tokens.generated.css:56:  --app-bg-primary: #f5f7fb;
src/styles/tokens.generated.css:57:  --app-bg-secondary: #eef2f7;
src/styles/tokens.generated.css:58:  --app-bg-gradient: radial-gradient(1200px 700px at 18% 12%, rgba(15,23,42,0.06), transparent 60%), radial-gradient(900px 600px at 85% 25%, rgba(14,165,233,0.08), transparent 58%), linear-gradient(180deg, #f5f7fb 0%, #eef2f7 55%, #e8edf4 100%);
src/styles/tokens.generated.css:59:  --surface-0: linear-gradient(180deg, rgba(255,255,255,0.95), rgba(246,248,252,0.95));
src/styles/tokens.generated.css:60:  --surface-1: linear-gradient(180deg, rgba(255,255,255,0.92), rgba(242,245,250,0.92));
src/styles/tokens.generated.css:61:  --surface-border: rgba(15,23,42,0.12);
src/styles/tokens.generated.css:62:  --text-primary: #0f172a;
src/styles/tokens.generated.css:63:  --text-muted: rgba(71,85,105,0.85);
src/styles/tokens.generated.css:64:  --accent-primary: rgba(14,165,233,0.9);
src/styles/tokens.generated.css:65:  --accent-glow: rgba(14,165,233,0.18);
src/styles/tokens.generated.css:66:  --shadow-md: 0 12px 32px rgba(15,23,42,0.12);
src/styles/tokens.generated.css:67:  --shadow-lg: 0 18px 46px rgba(15,23,42,0.14);
src/main.ts.bak.20260128_142710:1:import "./styles/tokens.generated.css";
src/main.ts.bak.20260128_142710:122:/* ICONTROL_THEME_BOOTSTRAP_V1 — SSOT tokens -> CSS vars (generated) */
src/main.ts.bak.20260128_142710:137:    const themeId = kind === "CP" ? "cp-dashboard-charcoal" : "app-foundation-slate";
src/main.ts.bak.20260128_142710:138:    const themeMode = "dark";
src/main.ts.bak.20260128_142710:139:    root.dataset.icThemeId = themeId;
src/main.ts.bak.20260128_142710:140:    root.dataset.icThemeMode = themeMode;
src/main.ts.bak.20260128_142710:307: * 4. queueMicrotask: theme, versionGate, bootRouter → première route.
src/pages/cp/views/users.ts:427:    modalContent.setAttribute("style", "background:var(--ic-panel); border:1px solid var(--ic-border); border-radius:12px; padding:24px; max-width:600px; width:100%; max-height:90vh; overflow-y:auto;");
src/pages/cp/views/users.ts:446:      label.setAttribute("style", "display:flex; align-items:center; gap:8px; padding:8px; background:var(--ic-inputBg); border-radius:6px; cursor:pointer;");
src/pages/cp/views/users.ts:463:      <button id="cancel-btn" style="padding:10px 20px; background:var(--ic-panel); color:var(--ic-text); border:none; border-radius:8px; cursor:pointer; font-weight:600;">Annuler</button>
src/pages/cp/views/users.ts:464:      <button id="save-btn" style="padding:10px 20px; background:var(--ic-inputBg); color:var(--ic-text); border:none; border-radius:8px; cursor:pointer; font-weight:600;">Enregistrer</button>
src/pages/cp/views/users.ts:561:    border-radius: 12px;
src/pages/cp/views/users.ts:577:        <input id="newUsernameInput" type="text" placeholder="ex: admin" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--ic-border, #3e3e3e); border-radius: 6px; color: var(--ic-text, #d4d4d4); font-size: 14px; box-sizing: border-box;">
src/pages/cp/views/users.ts:582:        <select id="newRoleSelect" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--ic-border, #3e3e3e); border-radius: 6px; color: var(--ic-text, #d4d4d4); font-size: 14px; box-sizing: border-box;">
src/pages/cp/views/users.ts:592:        <input id="newApplicationInput" type="text" value="Administration (CP)" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.05); border: 1px solid var(--ic-border, #3e3e3e); border-radius: 6px; color: var(--ic-text, #d4d4d4); font-size: 14px; box-sizing: border-box;">
src/pages/cp/views/users.ts:597:      <button id="cancelAddBtn" style="padding: 10px 20px; background: rgba(255,255,255,0.05); color: var(--ic-text, #d4d4d4); border: 1px solid var(--ic-border, #3e3e3e); border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px;">
src/pages/cp/views/users.ts:600:      <button id="confirmAddBtn" style="padding: 10px 20px; background: var(--ic-accent, #7b2cff); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 13px;">
src/pages/cp/registry.ts.bak.20260128_125710:138:  login_theme_cp: {
src/pages/cp/registry.ts.bak.20260128_125710:140:    routeId: "login_theme_cp",
src/pages/cp/registry.ts.bak.20260128_125710:141:    // NOTE: page_module_id = cp.login_theme (ROUTE_CATALOG SSOT)
src/pages/cp/registry.ts.bak.20260128_125710:143:      const mod = await import("./login-theme");
src/main.ts.bak_20260128_165957.bak_20260128_165957:1:import "./styles/tokens.generated.css";
src/main.ts.bak_20260128_165957.bak_20260128_165957:122:/* ICONTROL_THEME_BOOTSTRAP_V1 — SSOT tokens -> CSS vars (generated) */
src/main.ts.bak_20260128_165957.bak_20260128_165957:137:    const themeId = kind === "CP" ? "cp-dashboard-charcoal" : "app-foundation-slate";
src/main.ts.bak_20260128_165957.bak_20260128_165957:138:    const themeMode = "dark";
src/main.ts.bak_20260128_165957.bak_20260128_165957:139:    root.dataset.icThemeId = themeId;
src/main.ts.bak_20260128_165957.bak_20260128_165957:140:    root.dataset.icThemeMode = themeMode;
src/main.ts.bak_20260128_165957.bak_20260128_165957:308: * 4. queueMicrotask: theme, versionGate, bootRouter → première route.
src/styles/STYLE_ADMIN_FINAL.css:8:  /* --- SSOT CP tokens (fond uni) --- */
src/styles/STYLE_ADMIN_FINAL.css:9:  /* CP alias-only: no hardcoded colors and no self-references. */
src/styles/STYLE_ADMIN_FINAL.css:10:  --bg-app: var(--app-bg-primary);
src/styles/STYLE_ADMIN_FINAL.css:11:  --bg-surface: var(--app-bg-secondary);
src/styles/STYLE_ADMIN_FINAL.css:12:  --bg-panel: var(--app-bg-tertiary, var(--app-bg-primary));
src/styles/STYLE_ADMIN_FINAL.css:13:  --border-subtle: var(--surface-border);
src/styles/STYLE_ADMIN_FINAL.css:14:  --text-primary: var(--text-primary-strong, var(--text-primary));
src/styles/STYLE_ADMIN_FINAL.css:15:  --text-muted: var(--text-muted);
src/styles/STYLE_ADMIN_FINAL.css:16:  --accent-primary: var(--accent-primary);
src/styles/STYLE_ADMIN_FINAL.css:17:  --focus-ring: var(--accent-glow);
src/styles/STYLE_ADMIN_FINAL.css:18:  --table-header: var(--bg-panel);
src/styles/STYLE_ADMIN_FINAL.css:19:  --table-row-hover: var(--bg-surface);
src/styles/STYLE_ADMIN_FINAL.css:20:  --table-separator: var(--border-subtle);
src/styles/STYLE_ADMIN_FINAL.css:21:  --radius-sm: 6px;
src/styles/STYLE_ADMIN_FINAL.css:22:  --radius-md: 10px;
src/styles/STYLE_ADMIN_FINAL.css:23:  --radius-lg: 12px;
src/styles/STYLE_ADMIN_FINAL.css:24:  --space-xs: 4px;
src/styles/STYLE_ADMIN_FINAL.css:25:  --space-sm: 8px;
src/styles/STYLE_ADMIN_FINAL.css:26:  --space-md: 16px;
src/styles/STYLE_ADMIN_FINAL.css:27:  --space-lg: 24px;
src/styles/STYLE_ADMIN_FINAL.css:28:  --shadow-min: var(--shadow-md);
src/styles/STYLE_ADMIN_FINAL.css:29:  --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
src/styles/STYLE_ADMIN_FINAL.css:32:  --bg: var(--bg-app);
src/styles/STYLE_ADMIN_FINAL.css:33:  --panel: var(--bg-panel);
src/styles/STYLE_ADMIN_FINAL.css:34:  --panel2: var(--bg-surface);
src/styles/STYLE_ADMIN_FINAL.css:35:  --line: var(--border-subtle);
src/styles/STYLE_ADMIN_FINAL.css:36:  --lineLight: var(--border-subtle);
src/styles/STYLE_ADMIN_FINAL.css:37:  --text: var(--text-primary);
src/styles/STYLE_ADMIN_FINAL.css:38:  --muted: var(--text-muted);
src/styles/STYLE_ADMIN_FINAL.css:39:  --accent: var(--accent-primary);
src/styles/STYLE_ADMIN_FINAL.css:40:  --accentHover: var(--accent-primary);
src/styles/STYLE_ADMIN_FINAL.css:41:  --btn: var(--bg-panel);
src/styles/STYLE_ADMIN_FINAL.css:42:  --btn2: var(--bg-surface);
src/styles/STYLE_ADMIN_FINAL.css:43:  --radius: var(--radius-md);
src/styles/STYLE_ADMIN_FINAL.css:44:  --shadow: var(--shadow-min);
src/styles/STYLE_ADMIN_FINAL.css:45:  --shadowCard: var(--shadow-min);
src/styles/STYLE_ADMIN_FINAL.css:48:  --text-xs: 11px;
src/styles/STYLE_ADMIN_FINAL.css:49:  --text-sm: 12px;
src/styles/STYLE_ADMIN_FINAL.css:50:  --text-base: 13px;
src/styles/STYLE_ADMIN_FINAL.css:51:  --text-md: 14px;
src/styles/STYLE_ADMIN_FINAL.css:52:  --text-lg: 16px;
src/styles/STYLE_ADMIN_FINAL.css:53:  --text-xl: 18px;
src/styles/STYLE_ADMIN_FINAL.css:54:  --text-2xl: 20px;
src/styles/STYLE_ADMIN_FINAL.css:55:  --text-3xl: 24px;
src/styles/STYLE_ADMIN_FINAL.css:56:  --line-tight: 1.35;
src/styles/STYLE_ADMIN_FINAL.css:57:  --line-normal: 1.45;
src/styles/STYLE_ADMIN_FINAL.css:60:  --ic-bg: var(--bg-app);
src/styles/STYLE_ADMIN_FINAL.css:61:  --ic-panel: var(--bg-panel);
src/styles/STYLE_ADMIN_FINAL.css:62:  --ic-card: var(--bg-surface);
src/styles/STYLE_ADMIN_FINAL.css:63:  --ic-cardBorder: 1px solid var(--border-subtle);
src/styles/STYLE_ADMIN_FINAL.css:64:  --ic-border: var(--border-subtle);
src/styles/STYLE_ADMIN_FINAL.css:65:  --ic-borderLight: var(--lineLight);
src/styles/STYLE_ADMIN_FINAL.css:66:  --ic-text: var(--text-primary);
src/styles/STYLE_ADMIN_FINAL.css:67:  --ic-mutedText: var(--text-muted);
src/styles/STYLE_ADMIN_FINAL.css:68:  --ic-accent: var(--accent-primary);
src/styles/STYLE_ADMIN_FINAL.css:69:  --ic-accent2: var(--accent-primary);
src/styles/STYLE_ADMIN_FINAL.css:70:  --ic-success: var(--accent-primary);
src/styles/STYLE_ADMIN_FINAL.css:71:  --ic-warn: var(--accent-primary);
src/styles/STYLE_ADMIN_FINAL.css:72:  --ic-error: var(--accent-primary);
src/styles/STYLE_ADMIN_FINAL.css:73:  --ic-info: var(--accent-primary);
src/styles/STYLE_ADMIN_FINAL.css:74:  --ic-inputBg: var(--bg-surface);
src/styles/STYLE_ADMIN_FINAL.css:75:  --ic-bgHover: var(--bg-panel);
src/styles/STYLE_ADMIN_FINAL.css:76:  --ic-highlight: var(--bg-panel);
src/styles/STYLE_ADMIN_FINAL.css:77:  --ic-highlightSubtle: var(--bg-surface);
src/styles/STYLE_ADMIN_FINAL.css:78:  --ic-highlightMuted: var(--bg-surface);
src/styles/STYLE_ADMIN_FINAL.css:79:  --ic-surfaceOverlay: var(--bg-panel);
src/styles/STYLE_ADMIN_FINAL.css:80:  --ic-surfaceOverlayStrong: var(--bg-surface);
src/styles/STYLE_ADMIN_FINAL.css:81:  --ic-textOnAccent: var(--bg-app);
src/styles/STYLE_ADMIN_FINAL.css:82:  --ic-shadowToast: var(--shadow-min);
src/styles/STYLE_ADMIN_FINAL.css:83:  --ic-cardShadow: var(--shadowCard);
src/styles/STYLE_ADMIN_FINAL.css:86:  --ic-successBg: var(--accent-glow);
src/styles/STYLE_ADMIN_FINAL.css:87:  --ic-successBorder: var(--accent-primary);
src/styles/STYLE_ADMIN_FINAL.css:88:  --ic-warnBg: var(--accent-glow);
src/styles/STYLE_ADMIN_FINAL.css:89:  --ic-warnBorder: var(--accent-primary);
src/styles/STYLE_ADMIN_FINAL.css:90:  --ic-errorBg: var(--accent-glow);
src/styles/STYLE_ADMIN_FINAL.css:91:  --ic-errorBorder: var(--accent-primary);
src/styles/STYLE_ADMIN_FINAL.css:92:  --ic-infoBg: var(--accent-glow);
src/styles/STYLE_ADMIN_FINAL.css:93:  --ic-infoBorder: var(--accent-primary);
src/styles/STYLE_ADMIN_FINAL.css:94:  --ic-accentBg: var(--accent-glow);
src/styles/STYLE_ADMIN_FINAL.css:95:  --ic-accentBorder: var(--accent-primary);
src/styles/STYLE_ADMIN_FINAL.css:98:  --ic-chartPrimary: var(--accent-primary);
src/styles/STYLE_ADMIN_FINAL.css:99:  --ic-chartSecondary: var(--accent-primary);
src/styles/STYLE_ADMIN_FINAL.css:100:  --ic-chartTertiary: var(--accent-primary);
src/styles/STYLE_ADMIN_FINAL.css:101:  --ic-chartQuaternary: var(--accent-primary);
src/styles/STYLE_ADMIN_FINAL.css:102:  --ic-chartArea: var(--accent-glow);
src/styles/STYLE_ADMIN_FINAL.css:133:  border-radius: var(--radius);
src/styles/STYLE_ADMIN_FINAL.css:171:  border-radius: var(--radius-sm);
src/styles/STYLE_ADMIN_FINAL.css:187:  border-radius: var(--radius-md);
src/styles/STYLE_ADMIN_FINAL.css:219:  border-radius: var(--radius-md);
src/styles/STYLE_ADMIN_FINAL.css:253:  border-radius: var(--radius-sm);
src/styles/STYLE_ADMIN_FINAL.css:295:  border-radius: var(--radius-sm);
src/styles/STYLE_ADMIN_FINAL.css:344:  border-radius: 50%;
src/styles/STYLE_ADMIN_FINAL.css:354:  border-radius: 999px;
src/styles/STYLE_ADMIN_FINAL.css:357:  letter-spacing: 0.2px;
src/styles/STYLE_ADMIN_FINAL.css:398:  border-radius: var(--radius-md);
src/styles/STYLE_ADMIN_FINAL.css:406:  border-radius: var(--radius-sm);
src/styles/STYLE_ADMIN_FINAL.css:425:  border-radius: var(--radius-sm);
src/styles/STYLE_ADMIN_FINAL.css:442:  border-radius: var(--radius-md);
src/styles/STYLE_ADMIN_FINAL.css:531:  border-radius: var(--radius-md);
src/styles/STYLE_ADMIN_FINAL.css:545:  letter-spacing: 0.02em;
src/styles/STYLE_ADMIN_FINAL.css:602:  border-radius: var(--radius-sm);
src/styles/STYLE_ADMIN_FINAL.css:611:  border-radius: var(--radius-md);
src/styles/STYLE_ADMIN_FINAL.css:636:  letter-spacing: 0.5px;
src/styles/STYLE_ADMIN_FINAL.css:670:  border-radius: var(--radius-sm);
src/styles/STYLE_ADMIN_FINAL.css:702:  border-radius: var(--radius-sm);
src/styles/STYLE_ADMIN_FINAL.css:726:  border-radius: var(--radius-md);
src/styles/STYLE_ADMIN_FINAL.css:745:  letter-spacing: 0.4px;
src/styles/STYLE_ADMIN_FINAL.css:781:  border-radius: var(--radius-md);
src/styles/STYLE_ADMIN_FINAL.css:797:  border-radius: 999px;
src/styles/STYLE_ADMIN_FINAL.css:809:  border-radius: var(--radius-md);
src/styles/STYLE_ADMIN_FINAL.css:827:  border-radius: 12px;
src/styles/STYLE_ADMIN_FINAL.css:858:  border-radius: var(--radius-md);
src/styles/STYLE_ADMIN_FINAL.css:924:  border-radius: var(--radius-md);
src/styles/STYLE_ADMIN_FINAL.css:947:  border-radius: var(--radius-md);
src/styles/STYLE_ADMIN_FINAL.css:991:  border-radius: var(--radius-sm);
src/styles/STYLE_ADMIN_FINAL.css:1013:  border-radius: var(--radius-md);
src/styles/STYLE_ADMIN_FINAL.css:1057:  border-radius: var(--radius-md);
src/styles/STYLE_ADMIN_FINAL.css:1071:[data-app-kind="control_plane"] .ic-kpi__strip { margin-top:6px; height:4px; border-radius:999px; background-color: var(--ic-highlightMuted); overflow:hidden; }
src/styles/STYLE_ADMIN_FINAL.css:1094:[data-app-kind="control_plane"] .ic-chart__swatch { width:10px; height:10px; border-radius:50%; background-color: var(--ic-chartPrimary); }
src/styles/STYLE_ADMIN_FINAL.css:1104:  border-radius: var(--radius-md);
src/styles/STYLE_ADMIN_FINAL.css:1117:  border-radius: var(--radius-md);
src/styles/STYLE_ADMIN_FINAL.css:1127:  border-radius: var(--radius-md);
src/pages/cp/home-cp.ts.deleted.20260128_125710:37:      <button id="btn-dashboard" style="padding:10px 20px;background:var(--btn, var(--bg-panel));border:none;border-radius:6px;color:var(--text, var(--text-primary));cursor:pointer;font-size:14px;">
src/pages/cp/home-cp.ts.deleted.20260128_125710:40:      <button id="btn-pages" style="padding:10px 20px;background:var(--btn, var(--bg-panel));border:none;border-radius:6px;color:var(--text, var(--text-primary));cursor:pointer;font-size:14px;">
src/pages/cp/home-cp.ts.deleted.20260128_125710:43:      <button id="btn-audit" style="padding:10px 20px;background:var(--btn, var(--bg-panel));border:none;border-radius:6px;color:var(--text, var(--text-primary));cursor:pointer;font-size:14px;">
src/styles/STYLE_CLIENT_FINAL.css:19::root {
src/styles/STYLE_CLIENT_FINAL.css:21:  /* Shell (--bg, --panel, --line, --text, --muted, --accent, --btn, --radius, --font): depuis image Client */
src/styles/STYLE_CLIENT_FINAL.css:50:[data-scope="client-foundation"] .cf-panel { /* background, border, border-radius, box-shadow, padding: depuis image Client */ }
src/styles/STYLE_CLIENT_FINAL.css:55:[data-scope="client-foundation"] .cf-card { /* background, border, border-radius, padding: depuis image Client */ }
src/router.ts.bak.20260128_131439:206:    if (seg === "login-theme") return "login_theme_cp";
src/pages/cp/_shared/cpLayout.ts:20:    border-radius: var(--radius-md, 10px);
src/pages/cp/_shared/cpLayout.ts:46:    padding: 10px 14px; border-radius: var(--radius-sm, 8px);
src/router.ts.bak.20260128_124646:195:    if (seg === "login-theme") return "login_theme_cp";
src/pages/_shared/sections.ts:29:    "border-radius:12px",
src/main.ts.bak_20260128_160637:1:import "./styles/tokens.generated.css";
src/main.ts.bak_20260128_160637:122:/* ICONTROL_THEME_BOOTSTRAP_V1 — SSOT tokens -> CSS vars (generated) */
src/main.ts.bak_20260128_160637:137:    const themeId = kind === "CP" ? "cp-dashboard-charcoal" : "app-foundation-slate";
src/main.ts.bak_20260128_160637:138:    const themeMode = "dark";
src/main.ts.bak_20260128_160637:139:    root.dataset.icThemeId = themeId;
src/main.ts.bak_20260128_160637:140:    root.dataset.icThemeMode = themeMode;
src/main.ts.bak_20260128_160637:307: * 4. queueMicrotask: theme, versionGate, bootRouter → première route.
src/pages/cp/registry.ts:130:  login_theme_cp: {
src/pages/cp/registry.ts:132:    routeId: "login_theme_cp",
src/pages/cp/registry.ts:133:    // NOTE: page_module_id = cp.login_theme (ROUTE_CATALOG SSOT)
src/pages/cp/registry.ts:135:      const mod = await import("./login-theme");
src/__tests__/theme-css-vars.contract.test.ts:2:import { applyThemeTokensToCSSVars } from "../../../modules/core-system/ui/frontend-ts/pages/_shared/themeCssVars";
src/__tests__/theme-css-vars.contract.test.ts:4:describe("theme css vars (contract)", () => {
src/__tests__/theme-css-vars.contract.test.ts:5:  it("applique les variables CSS --ic-* sur :root", () => {
src/router.ts.bak_20260128_160637:240:    if (seg === "login-theme") return "login_theme_cp";
src/main.ts.bak.20260128_142420:1:import "./styles/tokens.generated.css";
src/main.ts.bak.20260128_142420:122:/* ICONTROL_THEME_BOOTSTRAP_V1 — SSOT tokens -> CSS vars (generated) */
src/main.ts.bak.20260128_142420:137:    const themeId = kind === "CP" ? "cp-dashboard-charcoal" : "app-foundation-slate";
src/main.ts.bak.20260128_142420:138:    const themeMode = "dark";
src/main.ts.bak.20260128_142420:139:    root.dataset.icThemeId = themeId;
src/main.ts.bak.20260128_142420:140:    root.dataset.icThemeMode = themeMode;
src/main.ts.bak.20260128_142420:307: * 4. queueMicrotask: theme, versionGate, bootRouter → première route.
src/pages/cp/login.ts.bak.20260128_142420:11:  `max-width:520px;margin:40px auto;padding:24px;border-radius:18px;` +
src/pages/cp/login.ts.bak.20260128_142420:15:  "width:100%;padding:12px 14px;border-radius:12px;border:1px solid var(--ic-border, #333);" +
src/pages/cp/login.ts.bak.20260128_142420:19:  "width:100%;padding:12px 14px;border-radius:12px;border:none;" +
src/pages/cp/login.ts.bak.20260128_142420:89:            <select id="login-lang" style="background:var(--ic-panel, #222);color:var(--ic-text, #fff);border:1px solid var(--ic-border, #333);padding:6px 10px;border-radius:8px;font-size:12px;cursor:pointer;">
src/pages/login.ts.disabled:6:    <div style="max-width:520px;margin:40px auto;padding:18px;border-radius:18px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06)">
src/pages/login.ts.disabled:10:          <select id="lang" style="background:transparent;color:inherit;border:1px solid rgba(255,255,255,0.15);padding:6px 10px;border-radius:10px">
src/pages/login.ts.disabled:21:        <input id="u" placeholder="Nom d’utilisateur" style="padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.12);background:rgba(0,0,0,0.25);color:inherit" />
src/pages/login.ts.disabled:22:        <input id="p" type="password" placeholder="Mot de passe" style="padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.12);background:rgba(0,0,0,0.25);color:inherit" />
src/pages/login.ts.disabled:24:        <button id="btn" style="padding:10px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.15);background:rgba(183,217,75,0.15);color:inherit;font-weight:800;cursor:pointer">Se connecter</button>
src/pages/cp/registry.ts.bak.20260128_130037:132:  login_theme_cp: {
src/pages/cp/registry.ts.bak.20260128_130037:134:    routeId: "login_theme_cp",
src/pages/cp/registry.ts.bak.20260128_130037:135:    // NOTE: page_module_id = cp.login_theme (ROUTE_CATALOG SSOT)
src/pages/cp/registry.ts.bak.20260128_130037:137:      const mod = await import("./login-theme");
src/pages/cp/dashboard.ts:115:    periodSelect.style.cssText = "height:36px; padding:0 12px; border-radius:var(--radius-md,8px); background:var(--ic-inputBg,#111418); border:1px solid var(--ic-border); color:var(--ic-text); font-size:var(--text-sm,12px); cursor:pointer;";
src/pages/cp/dashboard.ts:123:    gen.style.cssText = "padding:6px 14px; border-radius:var(--radius-sm,6px); border:1px solid var(--ic-accent); background:var(--ic-accentBg,rgba(59,130,246,.12)); color:var(--ic-accent); font-size:var(--text-sm); font-weight:600; cursor:pointer;";
src/pages/cp/dashboard.ts:127:    det.style.cssText = "padding:6px 14px; border-radius:var(--radius-sm,6px); border:1px solid transparent; background:transparent; color:var(--ic-mutedText); font-size:var(--text-sm); cursor:pointer;";
src/pages/cp/dashboard.ts:338:  chartWrap.style.cssText = "position:absolute; bottom:10px; left:12px; right:12px; height:40px; opacity:0.35; pointer-events:none; overflow:hidden; border-radius:var(--radius-sm,6px);";
src/pages/cp/dashboard.ts:492:      border-radius: 8px;
src/router.ts:242:    if (seg === "login-theme") return "login_theme_cp";
src/pages/app/home-app.ts:34:      <button id="btn-pages-inventory" style="padding:10px 20px;background:var(--btn, var(--bg-panel));border:none;border-radius:6px;color:var(--text, var(--text-primary));cursor:pointer;font-size:14px;">
src/pages/app/home-app.ts:37:      <button id="btn-client-catalog" style="padding:10px 20px;background:var(--btn, var(--bg-panel));border:none;border-radius:6px;color:var(--text, var(--text-primary));cursor:pointer;font-size:14px;">
src/pages/app/client-foundation.css:18:  border-radius: 18px;
src/pages/app/client-foundation.css:50:  border-radius: 14px;
src/pages/cp/settings-branding.ts:28:  const { card: colorsCard, body: colorsBody } = createSectionCard({
src/pages/cp/settings-branding.ts:30:    description: "Configuration de la palette de couleurs"
src/pages/cp/settings-branding.ts:33:  const colorsInfo = document.createElement("div");
src/pages/cp/settings-branding.ts:34:  colorsInfo.style.cssText = "margin-top:12px;padding:12px;background:var(--ic-card, #1a1d24);border-radius:8px;color:var(--ic-text, #e7ecef);font-size:14px;";
src/pages/cp/settings-branding.ts:35:  colorsInfo.textContent = "Les couleurs sont gérées via les design tokens. Utilisez les variables CSS pour personnaliser.";
src/pages/cp/settings-branding.ts:36:  colorsBody.appendChild(colorsInfo);
src/pages/cp/settings-branding.ts:37:  grid.appendChild(colorsCard);
src/pages/cp/settings-branding.ts:46:  logoInfo.style.cssText = "margin-top:12px;padding:12px;background:var(--ic-card, #1a1d24);border-radius:8px;color:var(--ic-text, #e7ecef);font-size:14px;";
src/pages/cp/settings-branding.ts:54:  backLink.style.cssText = "display:inline-block;margin-top:24px;padding:8px 16px;background:var(--ic-muted, #2a2d34);color:var(--ic-text, #e7ecef);border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;";
src/main.ts.bak_20260128_170444:1:import "./styles/tokens.generated.css";
src/main.ts.bak_20260128_170444:122:/* ICONTROL_THEME_BOOTSTRAP_V1 — SSOT tokens -> CSS vars (generated) */
src/main.ts.bak_20260128_170444:137:    const themeId = kind === "CP" ? "cp-dashboard-charcoal" : "app-foundation-slate";
src/main.ts.bak_20260128_170444:138:    const themeMode = "dark";
src/main.ts.bak_20260128_170444:139:    root.dataset.icThemeId = themeId;
src/main.ts.bak_20260128_170444:140:    root.dataset.icThemeMode = themeMode;
src/main.ts.bak_20260128_170444:308: * 4. queueMicrotask: theme, versionGate, bootRouter → première route.
src/main.ts.bak_20260128_160637.bak_20260128_165957:1:import "./styles/tokens.generated.css";
src/main.ts.bak_20260128_160637.bak_20260128_165957:122:/* ICONTROL_THEME_BOOTSTRAP_V1 — SSOT tokens -> CSS vars (generated) */
src/main.ts.bak_20260128_160637.bak_20260128_165957:137:    const themeId = kind === "CP" ? "cp-dashboard-charcoal" : "app-foundation-slate";
src/main.ts.bak_20260128_160637.bak_20260128_165957:138:    const themeMode = "dark";
src/main.ts.bak_20260128_160637.bak_20260128_165957:139:    root.dataset.icThemeId = themeId;
src/main.ts.bak_20260128_160637.bak_20260128_165957:140:    root.dataset.icThemeMode = themeMode;
src/main.ts.bak_20260128_160637.bak_20260128_165957:307: * 4. queueMicrotask: theme, versionGate, bootRouter → première route.
src/router.ts.bak.20260128_125710:195:    if (seg === "login-theme") return "login_theme_cp";
src/main.ts:1:import "./styles/tokens.generated.css";
src/main.ts:156:/* ICONTROL_THEME_BOOTSTRAP_V1 — SSOT tokens -> CSS vars (generated) */
src/main.ts:171:    const themeId = kind === "CP" ? "cp-dashboard-charcoal" : "app-foundation-slate";
src/main.ts:172:    const themeMode = "dark";
src/main.ts:173:    root.dataset.icThemeId = themeId;
src/main.ts:174:    root.dataset.icThemeMode = themeMode;
src/main.ts:342: * 4. queueMicrotask: theme, versionGate, bootRouter → première route.
src/core/runtime/storageKeys.ts.bak_20260128_155413:8:    theme: "icontrol_settings_v1.theme",
src/core/runtime/storageKeys.ts.bak_20260128_155413:21:    theme: "controlx_settings_v1.theme",
src/core/runtime/storageKeys.ts:8:    theme: "icontrol_settings_v1.theme",
src/core/theme/loadPreset.ts:1:import type { ThemeTokens } from "./themeTokens";
src/core/theme/loadPreset.ts:8:  // presetPath ex: "/src/core/theme/presets/cp-dashboard-charcoal.dark.json"
src/core/theme/applyThemeCssVars.ts:1:import type { ThemeTokens } from "./themeTokens";
src/core/theme/applyThemeCssVars.ts:38:  root.dataset.themeId = t.meta.id;
src/core/theme/applyThemeCssVars.ts:39:  root.dataset.themeVersion = t.meta.version;
src/core/theme/applyThemeCssVars.ts:40:  root.dataset.themeMode = t.meta.mode;
src/core/theme/applyThemeCssVars.ts:41:  if (t.meta.scope) root.dataset.themeScope = t.meta.scope;
src/core/theme/applyThemeCssVars.ts:42:  if (t.meta.brand) root.dataset.themeBrand = t.meta.brand;
src/core/theme/docs/README_THEME_SSOT.md:4:- Unifier visuel dashboard + login via **tokens SSOT**
src/core/theme/docs/README_THEME_SSOT.md:9:- core/theme/themeTokens.ts : contrat de tokens
src/core/theme/docs/README_THEME_SSOT.md:10:- core/theme/applyThemeCssVars.ts : apply des CSS vars
src/core/theme/docs/README_THEME_SSOT.md:11:- core/theme/presets/*.json : presets versionnés
src/core/theme/docs/README_THEME_SSOT.md:12:- core/theme/themeManifest.ts : publish/rollback (à brancher au runtime-config plus tard)
src/core/theme/docs/README_THEME_SSOT.md:17:3) applyThemeTokensToCssVars(document, tokens)
src/core/studio/runtime/execute.ts:190:          ` style="width:100%;padding:8px;border-radius:8px;border:1px solid var(--ic-border);background:transparent;color:inherit;" />`,
src/core/studio/runtime/execute.ts:201:    `<button type="button" style="padding:8px 12px;border-radius:10px;border:1px solid var(--ic-border);background:transparent;color:inherit;cursor:pointer;">Submit</button>`,
src/core/studio/blueprints/blueprint.presentation.json:3:  "tokens": {},
src/core/ui/themeManager.ts:4: * Theme Manager: Gestion centralisée des tokens CSS et thèmes
src/core/ui/themeManager.ts:7: * - Le visuel dépend uniquement de tokens (couleurs, spacing, radius, typography)
src/core/ui/themeManager.ts:8: * - Modifier les tokens / le thème → tout change visuellement, sans toucher aux pages
src/core/ui/themeManager.ts:23:let themeGateway: ReturnType<typeof createWriteGateway> | null = null;
src/core/ui/themeManager.ts:26:  if (themeGateway) return themeGateway;
src/core/ui/themeManager.ts:27:  themeGateway = createWriteGateway({
src/core/ui/themeManager.ts:33:    }, "themeShadowNoop"),
src/core/ui/themeManager.ts:36:  return themeGateway;
src/core/ui/themeManager.ts:43:    if (Array.isArray(decisions)) return isEnabled(decisions, "theme_shadow");
src/core/ui/themeManager.ts:45:    const state = flags?.theme_shadow?.state;
src/core/ui/themeManager.ts:66:  spacing: {
src/core/ui/themeManager.ts:80:  radius: number;
src/core/ui/themeManager.ts:87:  tokens: ThemeTokens;
src/core/ui/themeManager.ts:100:  spacing: {
src/core/ui/themeManager.ts:110:  radius: 18, // Aligné avec coreStyles.ts
src/core/ui/themeManager.ts:129:  private listeners: Array<(theme: Theme) => void> = [];
src/core/ui/themeManager.ts:137:      tokens: DEFAULT_TOKENS
src/core/ui/themeManager.ts:141:    // Le système original (applyThemeTokensToCSSVars) gère déjà les tokens
src/core/ui/themeManager.ts:148:  applyTheme(theme: Theme): void {
src/core/ui/themeManager.ts:150:    const tokens = theme.tokens;
src/core/ui/themeManager.ts:153:    root.style.setProperty("--ic-bg", tokens.bg);
src/core/ui/themeManager.ts:154:    root.style.setProperty("--ic-panel", tokens.panel);
src/core/ui/themeManager.ts:155:    root.style.setProperty("--ic-card", tokens.card);
src/core/ui/themeManager.ts:156:    root.style.setProperty("--ic-border", tokens.border);
src/core/ui/themeManager.ts:157:    root.style.setProperty("--ic-text", tokens.text);
src/core/ui/themeManager.ts:158:    root.style.setProperty("--ic-mutedText", tokens.mutedText);
src/core/ui/themeManager.ts:159:    root.style.setProperty("--ic-accent", tokens.accent);
src/core/ui/themeManager.ts:160:    root.style.setProperty("--ic-accent2", tokens.accent2);
src/core/ui/themeManager.ts:163:    root.style.setProperty("--ic-spacing-xs", tokens.spacing.xs);
src/core/ui/themeManager.ts:164:    root.style.setProperty("--ic-spacing-sm", tokens.spacing.sm);
src/core/ui/themeManager.ts:165:    root.style.setProperty("--ic-spacing-md", tokens.spacing.md);
src/core/ui/themeManager.ts:166:    root.style.setProperty("--ic-spacing-lg", tokens.spacing.lg);
src/core/ui/themeManager.ts:167:    root.style.setProperty("--ic-spacing-xl", tokens.spacing.xl);
src/core/ui/themeManager.ts:170:    root.style.setProperty("--ic-font", tokens.font);
src/core/ui/themeManager.ts:171:    root.style.setProperty("--ic-mono", tokens.mono);
src/core/ui/themeManager.ts:172:    root.style.setProperty("--ic-title-size", `${tokens.titleSize}px`);
src/core/ui/themeManager.ts:175:    root.style.setProperty("--ic-radius", `${tokens.radius}px`);
src/core/ui/themeManager.ts:176:    root.style.setProperty("--ic-shadow", tokens.shadow);
src/core/ui/themeManager.ts:178:    this.currentTheme = theme;
src/core/ui/themeManager.ts:179:    this.saveTheme(theme);
src/core/ui/themeManager.ts:180:    this.notifyListeners(theme);
src/core/ui/themeManager.ts:182:    logger.debug("THEME_MANAGER_APPLIED", { themeName: theme.name, mode: theme.mode });
src/core/ui/themeManager.ts:189:    let tokens = DEFAULT_TOKENS;
src/core/ui/themeManager.ts:192:      tokens = LIGHT_TOKENS;
src/core/ui/themeManager.ts:194:      tokens = DEFAULT_TOKENS;
src/core/ui/themeManager.ts:198:      tokens = prefersDark ? DEFAULT_TOKENS : LIGHT_TOKENS;
src/core/ui/themeManager.ts:204:      tokens
src/core/ui/themeManager.ts:216:   * Obtient les tokens actuels
src/core/ui/themeManager.ts:219:    return { ...this.currentTheme.tokens };
src/core/ui/themeManager.ts:223:   * Met à jour des tokens spécifiques
src/core/ui/themeManager.ts:228:      tokens: {
src/core/ui/themeManager.ts:229:        ...this.currentTheme.tokens,
src/core/ui/themeManager.ts:238:  subscribe(listener: (theme: Theme) => void): () => void {
src/core/ui/themeManager.ts:248:  private notifyListeners(theme: Theme): void {
src/core/ui/themeManager.ts:251:        listener(theme);
src/core/ui/themeManager.ts:258:  private saveTheme(theme: Theme): void {
src/core/ui/themeManager.ts:262:      localStorage.setItem("icontrol_theme", JSON.stringify(theme));
src/core/ui/themeManager.ts:269:    const correlationId = createCorrelationId("theme");
src/core/ui/themeManager.ts:275:      payload: theme,
src/core/ui/themeManager.ts:276:      meta: { shadow: true, source: "themeManager", key: "icontrol_theme" },
src/core/ui/themeManager.ts:303:      const saved = localStorage.getItem("icontrol_theme");
src/core/studio/blueprints/schemas/presentation.schema.json:6:    "tokens": { "type": "object" },
src/core/ui/charts.ts:219:/** Couleur de la palette par index (cycle si dépassement). */
src/core/ui/charts.ts:297:  const radius = size / 2 - 14;
src/core/ui/charts.ts:298:  const circumference = 2 * Math.PI * radius;
src/core/ui/charts.ts:308:    circle.setAttribute("r", String(radius));
src/core/ui/charts.ts:322:  hole.setAttribute("r", String(radius - 16));
src/core/studio/rules/internal/rules.impl.ts.bak_20260128_153110:5:  | { type: "setting"; path: "language" | "theme" }
src/core/studio/rules/internal/rules.impl.ts.bak_20260128_153110:40:  "controlx_settings_v1.theme"
src/core/studio/rules/internal/rules.impl.ts.bak_20260128_153110:46:  settings: { language?: string; theme?: string };
src/core/studio/rules/internal/rules.impl.ts.bak_20260128_153110:66:    if (ref.path === "theme") return ctx.settings.theme;
src/core/studio/blueprints/validate.ts:3: * - Validates only high-signal invariants to keep blast-radius minimal.
src/core/studio/rules/internal/rules.impl.ts.bak_20260128_155413:5:  | { type: "setting"; path: "language" | "theme" }
src/core/studio/rules/internal/rules.impl.ts.bak_20260128_155413:40:  "icontrol_settings_v1.theme"
src/core/studio/rules/internal/rules.impl.ts.bak_20260128_155413:46:  settings: { language?: string; theme?: string };
src/core/studio/rules/internal/rules.impl.ts.bak_20260128_155413:66:    if (ref.path === "theme") return ctx.settings.theme;
src/core/studio/rules/internal/rules.impl.ts:5:  | { type: "setting"; path: "language" | "theme" }
src/core/studio/rules/internal/rules.impl.ts:40:  "icontrol_settings_v1.theme"
src/core/studio/rules/internal/rules.impl.ts:46:  settings: { language?: string; theme?: string };
src/core/studio/rules/internal/rules.impl.ts:66:    if (ref.path === "theme") return ctx.settings.theme;
src/core/ui/catalog/index.ts.bak_20260128_155413:72:  const tokens = THEME_TOKENS[mode];
src/core/ui/catalog/index.ts.bak_20260128_155413:74:  root.style.setProperty("--ic-bg", tokens.bg);
src/core/ui/catalog/index.ts.bak_20260128_155413:75:  root.style.setProperty("--ic-panel", tokens.panel);
src/core/ui/catalog/index.ts.bak_20260128_155413:76:  root.style.setProperty("--ic-card", tokens.card);
src/core/ui/catalog/index.ts.bak_20260128_155413:77:  root.style.setProperty("--ic-border", tokens.border);
src/core/ui/catalog/index.ts.bak_20260128_155413:78:  root.style.setProperty("--ic-text", tokens.text);
src/core/ui/catalog/index.ts.bak_20260128_155413:79:  root.style.setProperty("--ic-mutedText", tokens.mutedText);
src/core/ui/catalog/index.ts.bak_20260128_155413:85:    window.localStorage.setItem("icontrol_settings_v1.theme", mode);
src/core/ui/catalog/index.ts.bak_20260128_155413:98:    payload: { key: "icontrol_settings_v1.theme", bytes: mode.length },
src/core/ui/catalog/index.ts.bak_20260128_155413:126:    border-radius: 8px;
src/core/ui/catalog/index.ts.bak_20260128_155413:164:    border-radius: 12px;
src/core/ui/catalog/index.ts.bak_20260128_155413:175:  const themeSelect = buildSelect(["dark", "light"], "dark");
src/core/ui/catalog/index.ts.bak_20260128_155413:176:  themeSelect.id = "ui-catalog-theme";
src/core/ui/catalog/index.ts.bak_20260128_155413:184:    border-radius: 8px;
src/core/ui/catalog/index.ts.bak_20260128_155413:192:  const themeLabel = document.createElement("label");
src/core/ui/catalog/index.ts.bak_20260128_155413:193:  themeLabel.textContent = "Theme";
src/core/ui/catalog/index.ts.bak_20260128_155413:194:  themeLabel.style.cssText = "display:flex; gap:6px; align-items:center; font-size:12px;";
src/core/ui/catalog/index.ts.bak_20260128_155413:195:  themeLabel.appendChild(themeSelect);
src/core/ui/catalog/index.ts.bak_20260128_155413:202:  controls.appendChild(themeLabel);
src/core/ui/catalog/index.ts.bak_20260128_155413:229:      heading.style.cssText = "font-size: 14px; font-weight: 700; letter-spacing: 0.4px;";
src/core/ui/catalog/index.ts.bak_20260128_155413:245:          border-radius: 12px;
src/core/ui/catalog/index.ts.bak_20260128_155413:262:          letter-spacing: 0.4px;
src/core/ui/catalog/index.ts.bak_20260128_155413:264:          border-radius: 999px;
src/core/ui/catalog/index.ts.bak_20260128_155413:287:  themeSelect.addEventListener("change", () => {
src/core/ui/catalog/index.ts.bak_20260128_155413:288:    applyTheme(themeSelect.value as "light" | "dark");
src/core/ui/catalog/index.ts.bak_controlx_20260128_150958:72:  const tokens = THEME_TOKENS[mode];
src/core/ui/catalog/index.ts.bak_controlx_20260128_150958:74:  root.style.setProperty("--ic-bg", tokens.bg);
src/core/ui/catalog/index.ts.bak_controlx_20260128_150958:75:  root.style.setProperty("--ic-panel", tokens.panel);
src/core/ui/catalog/index.ts.bak_controlx_20260128_150958:76:  root.style.setProperty("--ic-card", tokens.card);
src/core/ui/catalog/index.ts.bak_controlx_20260128_150958:77:  root.style.setProperty("--ic-border", tokens.border);
src/core/ui/catalog/index.ts.bak_controlx_20260128_150958:78:  root.style.setProperty("--ic-text", tokens.text);
src/core/ui/catalog/index.ts.bak_controlx_20260128_150958:79:  root.style.setProperty("--ic-mutedText", tokens.mutedText);
src/core/ui/catalog/index.ts.bak_controlx_20260128_150958:85:    window.localStorage.setItem("controlx_settings_v1.theme", mode);
src/core/ui/catalog/index.ts.bak_controlx_20260128_150958:98:    payload: { key: "controlx_settings_v1.theme", bytes: mode.length },
src/core/ui/catalog/index.ts.bak_controlx_20260128_150958:126:    border-radius: 8px;
src/core/ui/catalog/index.ts.bak_controlx_20260128_150958:164:    border-radius: 12px;
src/core/ui/catalog/index.ts.bak_controlx_20260128_150958:175:  const themeSelect = buildSelect(["dark", "light"], "dark");
src/core/ui/catalog/index.ts.bak_controlx_20260128_150958:176:  themeSelect.id = "ui-catalog-theme";
src/core/ui/catalog/index.ts.bak_controlx_20260128_150958:184:    border-radius: 8px;
src/core/ui/catalog/index.ts.bak_controlx_20260128_150958:192:  const themeLabel = document.createElement("label");
src/core/ui/catalog/index.ts.bak_controlx_20260128_150958:193:  themeLabel.textContent = "Theme";
src/core/ui/catalog/index.ts.bak_controlx_20260128_150958:194:  themeLabel.style.cssText = "display:flex; gap:6px; align-items:center; font-size:12px;";
src/core/ui/catalog/index.ts.bak_controlx_20260128_150958:195:  themeLabel.appendChild(themeSelect);
src/core/ui/catalog/index.ts.bak_controlx_20260128_150958:202:  controls.appendChild(themeLabel);
src/core/ui/catalog/index.ts.bak_controlx_20260128_150958:229:      heading.style.cssText = "font-size: 14px; font-weight: 700; letter-spacing: 0.4px;";
src/core/ui/catalog/index.ts.bak_controlx_20260128_150958:245:          border-radius: 12px;
src/core/ui/catalog/index.ts.bak_controlx_20260128_150958:262:          letter-spacing: 0.4px;
src/core/ui/catalog/index.ts.bak_controlx_20260128_150958:264:          border-radius: 999px;
src/core/ui/catalog/index.ts.bak_controlx_20260128_150958:287:  themeSelect.addEventListener("change", () => {
src/core/ui/catalog/index.ts.bak_controlx_20260128_150958:288:    applyTheme(themeSelect.value as "light" | "dark");
src/core/ui/catalog/defaults.ts:87:        description: "Compact spacing",
src/core/ui/catalog/defaults.ts:409:        border-radius: 8px;
src/core/ui/catalog/index.ts:72:  const tokens = THEME_TOKENS[mode];
src/core/ui/catalog/index.ts:74:  root.style.setProperty("--ic-bg", tokens.bg);
src/core/ui/catalog/index.ts:75:  root.style.setProperty("--ic-panel", tokens.panel);
src/core/ui/catalog/index.ts:76:  root.style.setProperty("--ic-card", tokens.card);
src/core/ui/catalog/index.ts:77:  root.style.setProperty("--ic-border", tokens.border);
src/core/ui/catalog/index.ts:78:  root.style.setProperty("--ic-text", tokens.text);
src/core/ui/catalog/index.ts:79:  root.style.setProperty("--ic-mutedText", tokens.mutedText);
src/core/ui/catalog/index.ts:85:    window.localStorage.setItem("icontrol_settings_v1.theme", mode);
src/core/ui/catalog/index.ts:98:    payload: { key: "icontrol_settings_v1.theme", bytes: mode.length },
src/core/ui/catalog/index.ts:126:    border-radius: 8px;
src/core/ui/catalog/index.ts:164:    border-radius: 12px;
src/core/ui/catalog/index.ts:175:  const themeSelect = buildSelect(["dark", "light"], "dark");
src/core/ui/catalog/index.ts:176:  themeSelect.id = "ui-catalog-theme";
src/core/ui/catalog/index.ts:184:    border-radius: 8px;
src/core/ui/catalog/index.ts:192:  const themeLabel = document.createElement("label");
src/core/ui/catalog/index.ts:193:  themeLabel.textContent = "Theme";
src/core/ui/catalog/index.ts:194:  themeLabel.style.cssText = "display:flex; gap:6px; align-items:center; font-size:12px;";
src/core/ui/catalog/index.ts:195:  themeLabel.appendChild(themeSelect);
src/core/ui/catalog/index.ts:202:  controls.appendChild(themeLabel);
src/core/ui/catalog/index.ts:229:      heading.style.cssText = "font-size: 14px; font-weight: 700; letter-spacing: 0.4px;";
src/core/ui/catalog/index.ts:245:          border-radius: 12px;
src/core/ui/catalog/index.ts:262:          letter-spacing: 0.4px;
src/core/ui/catalog/index.ts:264:          border-radius: 999px;
src/core/ui/catalog/index.ts:287:  themeSelect.addEventListener("change", () => {
src/core/ui/catalog/index.ts:288:    applyTheme(themeSelect.value as "light" | "dark");

## D) Stack styling (tailwind/postcss/css-in-js/libs)
src/router.ts.bak.20260128_130337:15:// Generated guards from SSOT (3 variants for different contexts)
src/router.ts.bak.20260128_130337:82:  | "tenants_cp" | "entitlements_cp" | "pages_cp" | "feature-flags_cp" | "publish_cp" | "audit_cp" | "subscription_cp" | "integrations_cp"
src/router.ts.bak.20260128_130337:183:    if (seg === "tenants") return "tenants_cp";
src/router.ts.bak.20260128_130337:232:    if (seg === "tenants") return "tenants_cp";
src/main.ts.bak_20260128_163524:256:    const hashWantsCp =
src/main.ts.bak_20260128_163524:260:    const hashWantsApp = hashPath.startsWith("/app");
src/main.ts.bak_20260128_163524:270:    if (pathIsApp && hashWantsCp) {
src/main.ts.bak_20260128_163524:274:    if (pathIsCp && hashWantsApp) {
src/main.ts.bak_20260128_163524:279:    const wantsCp = pathIsCp || hashWantsCp;
src/main.ts.bak_20260128_163524:280:    const wantsApp = pathIsApp || hashWantsApp;
src/main.ts.bak_20260128_163524:283:    if (kind === "APP" && wantsCp) {
src/main.ts.bak_20260128_163524:291:    if (kind === "CP" && wantsApp) {
src/main.ts.bak_20260128_163524:573:        shellRoot: root ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak_20260128_163524:574:        shellMain: main ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak_20260128_163524:575:        burger: burger ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak_20260128_163524:576:        drawer: drawer ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak_20260128_163524:626:  // Protection: vérifier que le shell est monté avant de rendre la page
src/main.ts.bak_20260128_163524:709:    // ICONTROL_VERSION_GATE_V1: Vérifier compatibilité des versions avant de continuer
src/main.ts.bak_20260128_163524.bak_20260128_165957:256:    const hashWantsCp =
src/main.ts.bak_20260128_163524.bak_20260128_165957:260:    const hashWantsApp = hashPath.startsWith("/app");
src/main.ts.bak_20260128_163524.bak_20260128_165957:270:    if (pathIsApp && hashWantsCp) {
src/main.ts.bak_20260128_163524.bak_20260128_165957:274:    if (pathIsCp && hashWantsApp) {
src/main.ts.bak_20260128_163524.bak_20260128_165957:279:    const wantsCp = pathIsCp || hashWantsCp;
src/main.ts.bak_20260128_163524.bak_20260128_165957:280:    const wantsApp = pathIsApp || hashWantsApp;
src/main.ts.bak_20260128_163524.bak_20260128_165957:283:    if (kind === "APP" && wantsCp) {
src/main.ts.bak_20260128_163524.bak_20260128_165957:291:    if (kind === "CP" && wantsApp) {
src/main.ts.bak_20260128_163524.bak_20260128_165957:573:        shellRoot: root ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak_20260128_163524.bak_20260128_165957:574:        shellMain: main ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak_20260128_163524.bak_20260128_165957:575:        burger: burger ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak_20260128_163524.bak_20260128_165957:576:        drawer: drawer ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak_20260128_163524.bak_20260128_165957:626:  // Protection: vérifier que le shell est monté avant de rendre la page
src/main.ts.bak_20260128_163524.bak_20260128_165957:709:    // ICONTROL_VERSION_GATE_V1: Vérifier compatibilité des versions avant de continuer
src/router.ts.bak_20260128_160637:34:// Generated guards from SSOT (3 variants for different contexts)
src/router.ts.bak_20260128_160637:81:// CP: décommissionner définitivement #/dashboard au bootstrap (avant résolution/rendu)
src/router.ts.bak_20260128_160637:128:  | "tenants_cp" | "entitlements_cp" | "pages_cp" | "feature-flags_cp" | "publish_cp" | "audit_cp" | "subscription_cp" | "integrations_cp"
src/router.ts.bak_20260128_160637:229:    if (seg === "tenants") return "tenants_cp";
src/router.ts.bak_20260128_160637:278:    if (seg === "tenants") return "tenants_cp";
src/router.ts.bak.20260128_125710:15:// Generated guards from SSOT (3 variants for different contexts)
src/router.ts.bak.20260128_125710:82:  | "tenants_cp" | "entitlements_cp" | "pages_cp" | "feature-flags_cp" | "publish_cp" | "audit_cp" | "subscription_cp" | "integrations_cp"
src/router.ts.bak.20260128_125710:184:    if (seg === "tenants") return "tenants_cp";
src/router.ts.bak.20260128_125710:234:    if (seg === "tenants") return "tenants_cp";
src/dev/diagnostic.contract.test.ts:14:    // Contract: if present, must respect invariants.
src/pages/dashboard.ts.disabled:13:          <div style="font-weight:900">Santé PME</div>
src/main.ts.bak_20260128_160637.bak_20260128_165957:256:    const hashWantsCp =
src/main.ts.bak_20260128_160637.bak_20260128_165957:260:    const hashWantsApp = hashPath.startsWith("/app");
src/main.ts.bak_20260128_160637.bak_20260128_165957:270:    if (pathIsApp && hashWantsCp) {
src/main.ts.bak_20260128_160637.bak_20260128_165957:274:    if (pathIsCp && hashWantsApp) {
src/main.ts.bak_20260128_160637.bak_20260128_165957:279:    const wantsCp = pathIsCp || hashWantsCp;
src/main.ts.bak_20260128_160637.bak_20260128_165957:280:    const wantsApp = pathIsApp || hashWantsApp;
src/main.ts.bak_20260128_160637.bak_20260128_165957:283:    if (kind === "APP" && wantsCp) {
src/main.ts.bak_20260128_160637.bak_20260128_165957:291:    if (kind === "CP" && wantsApp) {
src/main.ts.bak_20260128_160637.bak_20260128_165957:573:        shellRoot: root ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak_20260128_160637.bak_20260128_165957:574:        shellMain: main ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak_20260128_160637.bak_20260128_165957:575:        burger: burger ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak_20260128_160637.bak_20260128_165957:576:        drawer: drawer ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak_20260128_160637.bak_20260128_165957:626:  // Protection: vérifier que le shell est monté avant de rendre la page
src/main.ts.bak_20260128_160637.bak_20260128_165957:709:    // ICONTROL_VERSION_GATE_V1: Vérifier compatibilité des versions avant de continuer
src/router.ts.bak.20260128_124646:15:// Generated guards from SSOT (3 variants for different contexts)
src/router.ts.bak.20260128_124646:82:  | "tenants_cp" | "entitlements_cp" | "pages_cp" | "feature-flags_cp" | "publish_cp" | "audit_cp" | "subscription_cp" | "integrations_cp"
src/router.ts.bak.20260128_124646:184:    if (seg === "tenants") return "tenants_cp";
src/router.ts.bak.20260128_124646:234:    if (seg === "tenants") return "tenants_cp";
src/router.ts.bak.20260128_130449:15:// Generated guards from SSOT (3 variants for different contexts)
src/router.ts.bak.20260128_130449:82:  | "tenants_cp" | "entitlements_cp" | "pages_cp" | "feature-flags_cp" | "publish_cp" | "audit_cp" | "subscription_cp" | "integrations_cp"
src/router.ts.bak.20260128_130449:183:    if (seg === "tenants") return "tenants_cp";
src/router.ts.bak.20260128_130449:232:    if (seg === "tenants") return "tenants_cp";
src/main.ts.bak_20260128_170444:257:    const hashWantsCp =
src/main.ts.bak_20260128_170444:261:    const hashWantsApp = hashPath.startsWith("/app");
src/main.ts.bak_20260128_170444:271:    if (pathIsApp && hashWantsCp) {
src/main.ts.bak_20260128_170444:275:    if (pathIsCp && hashWantsApp) {
src/main.ts.bak_20260128_170444:280:    const wantsCp = pathIsCp || hashWantsCp;
src/main.ts.bak_20260128_170444:281:    const wantsApp = pathIsApp || hashWantsApp;
src/main.ts.bak_20260128_170444:284:    if (kind === "APP" && wantsCp) {
src/main.ts.bak_20260128_170444:292:    if (kind === "CP" && wantsApp) {
src/main.ts.bak_20260128_170444:574:        shellRoot: root ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak_20260128_170444:575:        shellMain: main ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak_20260128_170444:576:        burger: burger ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak_20260128_170444:577:        drawer: drawer ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak_20260128_170444:627:  // Protection: vérifier que le shell est monté avant de rendre la page
src/main.ts.bak_20260128_170444:710:    // ICONTROL_VERSION_GATE_V1: Vérifier compatibilité des versions avant de continuer
src/__tests__/subscription-guards.contract.test.ts:29:      tenantId: "t1",
src/main.ts:291:    const hashWantsCp =
src/main.ts:295:    const hashWantsApp = hashPath.startsWith("/app");
src/main.ts:305:    if (pathIsApp && hashWantsCp) {
src/main.ts:309:    if (pathIsCp && hashWantsApp) {
src/main.ts:314:    const wantsCp = pathIsCp || hashWantsCp;
src/main.ts:315:    const wantsApp = pathIsApp || hashWantsApp;
src/main.ts:318:    if (kind === "APP" && wantsCp) {
src/main.ts:326:    if (kind === "CP" && wantsApp) {
src/main.ts:607:        shellRoot: root ? "✅ Trouvé" : "❌ Manquant",
src/main.ts:608:        shellMain: main ? "✅ Trouvé" : "❌ Manquant",
src/main.ts:609:        burger: burger ? "✅ Trouvé" : "❌ Manquant",
src/main.ts:610:        drawer: drawer ? "✅ Trouvé" : "❌ Manquant",
src/main.ts:661:  // Protection: vérifier que le shell est monté avant de rendre la page
src/main.ts:743:    // ICONTROL_VERSION_GATE_V1: Vérifier compatibilité des versions avant de continuer
src/router.ts.bak.20260128_132100:35:// Generated guards from SSOT (3 variants for different contexts)
src/router.ts.bak.20260128_132100:67:// CP: décommissionner définitivement #/home-cp au bootstrap (avant résolution/rendu)
src/router.ts.bak.20260128_132100:114:  | "tenants_cp" | "entitlements_cp" | "pages_cp" | "feature-flags_cp" | "publish_cp" | "audit_cp" | "subscription_cp" | "integrations_cp"
src/router.ts.bak.20260128_132100:215:    if (seg === "tenants") return "tenants_cp";
src/router.ts.bak.20260128_132100:264:    if (seg === "tenants") return "tenants_cp";
src/main.ts.bak_20260128_160637:256:    const hashWantsCp =
src/main.ts.bak_20260128_160637:260:    const hashWantsApp = hashPath.startsWith("/app");
src/main.ts.bak_20260128_160637:270:    if (pathIsApp && hashWantsCp) {
src/main.ts.bak_20260128_160637:274:    if (pathIsCp && hashWantsApp) {
src/main.ts.bak_20260128_160637:279:    const wantsCp = pathIsCp || hashWantsCp;
src/main.ts.bak_20260128_160637:280:    const wantsApp = pathIsApp || hashWantsApp;
src/main.ts.bak_20260128_160637:283:    if (kind === "APP" && wantsCp) {
src/main.ts.bak_20260128_160637:291:    if (kind === "CP" && wantsApp) {
src/main.ts.bak_20260128_160637:573:        shellRoot: root ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak_20260128_160637:574:        shellMain: main ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak_20260128_160637:575:        burger: burger ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak_20260128_160637:576:        drawer: drawer ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak_20260128_160637:626:  // Protection: vérifier que le shell est monté avant de rendre la page
src/main.ts.bak_20260128_160637:709:    // ICONTROL_VERSION_GATE_V1: Vérifier compatibilité des versions avant de continuer
src/localAuth.ts:8:import { getTenantId } from "./core/runtime/tenant";
src/localAuth.ts:99:  const tenantId = (typeof getTenantId === "function" ? getTenantId() : "public") || "public";
src/localAuth.ts:103:    tenantId,
src/localAuth.ts:114:        tenant_id: tenantId,
src/localAuth.ts:122:      tenant_id: tenantId,
src/localAuth.ts:146:  const tenantId = (typeof getTenantId === "function" ? getTenantId() : "public") || "public";
src/localAuth.ts:150:    tenantId,
src/localAuth.ts:161:        tenant_id: tenantId,
src/localAuth.ts:169:      tenant_id: tenantId,
src/localAuth.ts:304:  if (!u || !p) return { ok: false, error: "Identifiants requis." };
src/localAuth.ts:308:    return { ok: false, error: "Identifiant invalide." };
src/pages/cp/registry.ts.bak.20260128_125810:49:  tenants_cp: {
src/pages/cp/registry.ts.bak.20260128_125810:50:    routeId: "tenants_cp" as RouteId,
src/pages/cp/registry.ts.bak.20260128_125810:52:      // Page CP Tenants (composants visuels core)
src/pages/cp/registry.ts.bak.20260128_125810:53:      const m = await import("./tenants");
src/pages/cp/registry.ts.bak.20260128_125810:54:      await m.renderTenants(root);
src/pages/cp/registry.ts.bak.20260128_125810:61:      // Page CP Entitlements (composants visuels core)
src/pages/cp/registry.ts.bak.20260128_125810:70:      // Page CP Pages Registry (composants visuels core)
src/pages/cp/registry.ts.bak.20260128_125810:79:      // Page CP Feature Flags (composants visuels core)
src/pages/cp/registry.ts.bak.20260128_125810:88:      // Page CP Publish Center (composants visuels core)
src/pages/cp/feature-flags.ts:30:  { key: "cp.tenant.billing", owner: "Billing", status: "OFF", rollout: "0%", expiry: "—" },
src/main.ts.bak.20260128_142420:256:    const hashWantsCp =
src/main.ts.bak.20260128_142420:260:    const hashWantsApp = hashPath.startsWith("/app");
src/main.ts.bak.20260128_142420:270:    if (pathIsApp && hashWantsCp) {
src/main.ts.bak.20260128_142420:274:    if (pathIsCp && hashWantsApp) {
src/main.ts.bak.20260128_142420:279:    const wantsCp = pathIsCp || hashWantsCp;
src/main.ts.bak.20260128_142420:280:    const wantsApp = pathIsApp || hashWantsApp;
src/main.ts.bak.20260128_142420:283:    if (kind === "APP" && wantsCp) {
src/main.ts.bak.20260128_142420:291:    if (kind === "CP" && wantsApp) {
src/main.ts.bak.20260128_142420:573:        shellRoot: root ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak.20260128_142420:574:        shellMain: main ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak.20260128_142420:575:        burger: burger ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak.20260128_142420:576:        drawer: drawer ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak.20260128_142420:626:  // Protection: vérifier que le shell est monté avant de rendre la page
src/main.ts.bak.20260128_142420:709:    // ICONTROL_VERSION_GATE_V1: Vérifier compatibilité des versions avant de continuer
src/router.ts.bak.20260128_132152:35:// Generated guards from SSOT (3 variants for different contexts)
src/router.ts.bak.20260128_132152:84:// CP: décommissionner définitivement #/home-cp au bootstrap (avant résolution/rendu)
src/router.ts.bak.20260128_132152:131:  | "tenants_cp" | "entitlements_cp" | "pages_cp" | "feature-flags_cp" | "publish_cp" | "audit_cp" | "subscription_cp" | "integrations_cp"
src/router.ts.bak.20260128_132152:232:    if (seg === "tenants") return "tenants_cp";
src/router.ts.bak.20260128_132152:281:    if (seg === "tenants") return "tenants_cp";
src/main.ts.bak_20260128_165957:257:    const hashWantsCp =
src/main.ts.bak_20260128_165957:261:    const hashWantsApp = hashPath.startsWith("/app");
src/main.ts.bak_20260128_165957:271:    if (pathIsApp && hashWantsCp) {
src/main.ts.bak_20260128_165957:275:    if (pathIsCp && hashWantsApp) {
src/main.ts.bak_20260128_165957:280:    const wantsCp = pathIsCp || hashWantsCp;
src/main.ts.bak_20260128_165957:281:    const wantsApp = pathIsApp || hashWantsApp;
src/main.ts.bak_20260128_165957:284:    if (kind === "APP" && wantsCp) {
src/main.ts.bak_20260128_165957:292:    if (kind === "CP" && wantsApp) {
src/main.ts.bak_20260128_165957:574:        shellRoot: root ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak_20260128_165957:575:        shellMain: main ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak_20260128_165957:576:        burger: burger ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak_20260128_165957:577:        drawer: drawer ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak_20260128_165957:627:  // Protection: vérifier que le shell est monté avant de rendre la page
src/main.ts.bak_20260128_165957:710:    // ICONTROL_VERSION_GATE_V1: Vérifier compatibilité des versions avant de continuer
src/core/control-plane/guards/pageAccessGuard.ts:3: * Phase 2.4: guard « route activée pour le tenant » via TENANT_FEATURE_MATRIX.
src/core/control-plane/guards/pageAccessGuard.ts:5:import { isPageEnabledForTenant } from "../../entitlements";
src/core/control-plane/guards/pageAccessGuard.ts:10:  return ALWAYS_ALLOWED.includes(pageId) || isPageEnabledForTenant(pageId);
src/core/control-plane/guards/pageAccessGuard.ts:24:  // Désactivé pour l'instant: contourner isPageEnabledForTenant pour éviter "Accès refusé" / #/dashboard?state=denied.
src/core/control-plane/guards/pageAccessGuard.ts:29:  // const ok = isPageEnabledForTenant(routeId);
src/__tests__/feature-flags-enforce.contract.test.ts:6:    const d = decideFlag("a", { state: "FORCE_OFF" }, { tenant: "t1" });
src/__tests__/feature-flags-enforce.contract.test.ts:11:    expect(decideFlag("a", { state: "ON" }, { tenant: "t1" }).kind).toBe("ENABLED");
src/__tests__/feature-flags-enforce.contract.test.ts:12:    expect(decideFlag("a", { state: "OFF" }, { tenant: "t1" }).kind).toBe("DISABLED");
src/__tests__/feature-flags-enforce.contract.test.ts:15:  it("ROLLOUT is deterministic per tenant/key/seed", () => {
src/__tests__/feature-flags-enforce.contract.test.ts:16:    const a1 = decideFlag("f", { state: "ROLLOUT", rollout: 50 }, { tenant: "t1", seed: "s" });
src/__tests__/feature-flags-enforce.contract.test.ts:17:    const a2 = decideFlag("f", { state: "ROLLOUT", rollout: 50 }, { tenant: "t1", seed: "s" });
src/__tests__/feature-flags-enforce.contract.test.ts:22:  it("different tenant yields potentially different bucket", () => {
src/__tests__/feature-flags-enforce.contract.test.ts:23:    const a1 = decideFlag("f", { state: "ROLLOUT", rollout: 50 }, { tenant: "t1", seed: "s" });
src/__tests__/feature-flags-enforce.contract.test.ts:24:    const a2 = decideFlag("f", { state: "ROLLOUT", rollout: 50 }, { tenant: "t2", seed: "s" });
src/__tests__/feature-flags-enforce.contract.test.ts:27:    // not strictly guaranteed different, but extremely likely; assert only that bucket exists
src/__tests__/feature-flags-enforce.contract.test.ts:33:      { tenant: "t1" }
src/pages/cp/login-theme.ts:36:      "Configuration du branding multi-tenant pour l’écran de login (tokens, logo, fond, CTA)."
src/router.ts:34:// Generated guards from SSOT (3 variants for different contexts)
src/router.ts:82:// CP: décommissionner définitivement #/dashboard au bootstrap (avant résolution/rendu)
src/router.ts:130:  | "tenants_cp" | "entitlements_cp" | "pages_cp" | "feature-flags_cp" | "publish_cp" | "audit_cp" | "subscription_cp" | "integrations_cp"
src/router.ts:231:    if (seg === "tenants") return "tenants_cp";
src/router.ts:280:    if (seg === "tenants") return "tenants_cp";
src/pages/login.ts.disabled:18:      <div style="margin-top:14px;opacity:.8">Entrez vos identifiants.</div>
src/router.ts.bak.20260128_130548:15:// Generated guards from SSOT (3 variants for different contexts)
src/router.ts.bak.20260128_130548:82:  | "tenants_cp" | "entitlements_cp" | "pages_cp" | "feature-flags_cp" | "publish_cp" | "audit_cp" | "subscription_cp" | "integrations_cp"
src/router.ts.bak.20260128_130548:183:    if (seg === "tenants") return "tenants_cp";
src/router.ts.bak.20260128_130548:232:    if (seg === "tenants") return "tenants_cp";
src/main.ts.bak.20260128_142906:256:    const hashWantsCp =
src/main.ts.bak.20260128_142906:260:    const hashWantsApp = hashPath.startsWith("/app");
src/main.ts.bak.20260128_142906:270:    if (pathIsApp && hashWantsCp) {
src/main.ts.bak.20260128_142906:274:    if (pathIsCp && hashWantsApp) {
src/main.ts.bak.20260128_142906:279:    const wantsCp = pathIsCp || hashWantsCp;
src/main.ts.bak.20260128_142906:280:    const wantsApp = pathIsApp || hashWantsApp;
src/main.ts.bak.20260128_142906:283:    if (kind === "APP" && wantsCp) {
src/main.ts.bak.20260128_142906:291:    if (kind === "CP" && wantsApp) {
src/main.ts.bak.20260128_142906:573:        shellRoot: root ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak.20260128_142906:574:        shellMain: main ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak.20260128_142906:575:        burger: burger ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak.20260128_142906:576:        drawer: drawer ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak.20260128_142906:626:  // Protection: vérifier que le shell est monté avant de rendre la page
src/main.ts.bak.20260128_142906:709:    // ICONTROL_VERSION_GATE_V1: Vérifier compatibilité des versions avant de continuer
src/pages/cp/system.ts:38:    subtitle: "Santé runtime, SAFE_MODE, politiques gouvernées",
src/__tests__/no-import-sideeffects-critical.contract.test.ts:13:  // We still want the module to load for other imports if needed,
src/router.ts.bak.20260128_141916:35:// Generated guards from SSOT (3 variants for different contexts)
src/router.ts.bak.20260128_141916:84:// CP: décommissionner définitivement #/dashboard au bootstrap (avant résolution/rendu)
src/router.ts.bak.20260128_141916:131:  | "tenants_cp" | "entitlements_cp" | "pages_cp" | "feature-flags_cp" | "publish_cp" | "audit_cp" | "subscription_cp" | "integrations_cp"
src/router.ts.bak.20260128_141916:232:    if (seg === "tenants") return "tenants_cp";
src/router.ts.bak.20260128_141916:281:    if (seg === "tenants") return "tenants_cp";
src/core/control-plane/services/auditService.ts:3:/** AuditService — stub pour résolution de build (tenants). */
src/router.ts.bak.20260128_142135:35:// Generated guards from SSOT (3 variants for different contexts)
src/router.ts.bak.20260128_142135:84:// CP: décommissionner définitivement #/dashboard au bootstrap (avant résolution/rendu)
src/router.ts.bak.20260128_142135:131:  | "tenants_cp" | "entitlements_cp" | "pages_cp" | "feature-flags_cp" | "publish_cp" | "audit_cp" | "subscription_cp" | "integrations_cp"
src/router.ts.bak.20260128_142135:232:    if (seg === "tenants") return "tenants_cp";
src/router.ts.bak.20260128_142135:281:    if (seg === "tenants") return "tenants_cp";
src/core/control-plane/services/tenantService.ts:3:import type { Tenant } from "../types";
src/core/control-plane/services/tenantService.ts:5:/** TenantService — stub pour résolution de build. listTenants retourne [] ; la page tenants utilise des demos si vide. */
src/core/control-plane/services/tenantService.ts:6:export class TenantService {
src/core/control-plane/services/tenantService.ts:8:  async listTenants(): Promise<Tenant[]> {
src/pages/cp/views/users.ts:4: * Complètement indépendant de APP
src/pages/cp/views/users.ts:58:import { getTenantId } from "../../../core/runtime/tenant";
src/pages/cp/views/users.ts:97:      const tenantId = (typeof getTenantId === "function" ? getTenantId() : "public") || "public";
src/pages/cp/views/users.ts:101:        tenantId,
src/pages/cp/views/users.ts:112:            tenant_id: tenantId,
src/pages/cp/views/users.ts:120:          tenant_id: tenantId,
src/__tests__/audit-trace-context.contract.test.ts:6:  it("enriches payload with tenant/traceId/requestId and is idempotent per runtime", () => {
src/__tests__/audit-trace-context.contract.test.ts:9:    const rt: any = { __tenant: "default", audit: { emit } };
src/__tests__/audit-trace-context.contract.test.ts:21:    expect(payload1.tenant).toBe("default");
src/router.ts.bak.20260128_131638:35:// Generated guards from SSOT (3 variants for different contexts)
src/router.ts.bak.20260128_131638:67:// CP: décommissionner définitivement #/home-cp au bootstrap (avant résolution/rendu)
src/router.ts.bak.20260128_131638:114:  | "tenants_cp" | "entitlements_cp" | "pages_cp" | "feature-flags_cp" | "publish_cp" | "audit_cp" | "subscription_cp" | "integrations_cp"
src/router.ts.bak.20260128_131638:215:    if (seg === "tenants") return "tenants_cp";
src/router.ts.bak.20260128_131638:264:    if (seg === "tenants") return "tenants_cp";
src/core/control-plane/types.ts:2:export interface Tenant {
src/core/control-plane/types.ts:3:  tenantId: string;
src/pages/cp/audit.ts:28:  { ts: "2024-10-18 09:12", level: "INFO", action: "tenant.create", actor: "admin.core", scope: "cp", correlationId: "a-1024" },
src/__tests__/subscription-persistence.contract.test.ts:10:      tenantId: "t_persist",
src/__tests__/subscription-persistence.contract.test.ts:19:    const got = await store.getByTenantId("t_persist");
src/__tests__/subscription-persistence.contract.test.ts:22:    const out = resolveEntitlements({ tenantId: "t_persist", subscription: got!, nowIso: "2026-01-11T00:00:00.000Z" });
src/__tests__/subscription-persistence.contract.test.ts:35:    const got = await store.getByTenantId("t_corrupt");
src/__tests__/subscription-persistence.contract.test.ts:38:    const out = resolveEntitlements({ tenantId: "t_corrupt", subscription: null, nowIso: "2026-01-11T00:00:00.000Z" });
src/pages/cp/registry.ts.bak.20260128_130037:49:  tenants_cp: {
src/pages/cp/registry.ts.bak.20260128_130037:50:    routeId: "tenants_cp",
src/pages/cp/registry.ts.bak.20260128_130037:52:      // Page CP Tenants (composants visuels core)
src/pages/cp/registry.ts.bak.20260128_130037:53:      const m = await import("./tenants");
src/pages/cp/registry.ts.bak.20260128_130037:54:      await m.renderTenants(root);
src/pages/cp/registry.ts.bak.20260128_130037:61:      // Page CP Entitlements (composants visuels core)
src/pages/cp/registry.ts.bak.20260128_130037:70:      // Page CP Pages Registry (composants visuels core)
src/pages/cp/registry.ts.bak.20260128_130037:79:      // Page CP Feature Flags (composants visuels core)
src/pages/cp/registry.ts.bak.20260128_130037:88:      // Page CP Publish Center (composants visuels core)
src/core/control-plane/storage.ts:2:import { getTenantId } from "../runtime/tenant";
src/core/control-plane/storage.ts:9:/** LocalStorageProvider — stub pour résolution de build (tenants, audit). */
src/core/control-plane/storage.ts:58:    const tenantId = (typeof getTenantId === "function" ? getTenantId() : "public") as string;
src/core/control-plane/storage.ts:62:      tenantId,
src/core/control-plane/storage.ts:73:          tenant_id: tenantId,
src/core/control-plane/storage.ts:81:        tenant_id: tenantId,
src/pages/cp/subscription.ts:18:type PlanRow = { plan: string; status: "ACTIVE" | "TRIAL" | "PAST_DUE"; mrr: string; tenants: number };
src/pages/cp/subscription.ts:22:  { plan: "ENTERPRISE", status: "ACTIVE", mrr: "$84,000", tenants: 18 },
src/pages/cp/subscription.ts:23:  { plan: "PRO", status: "ACTIVE", mrr: "$32,500", tenants: 44 },
src/pages/cp/subscription.ts:24:  { plan: "TRIAL", status: "TRIAL", mrr: "$0", tenants: 12 },
src/pages/cp/subscription.ts:25:  { plan: "LEGACY", status: "PAST_DUE", mrr: "$4,200", tenants: 3 }
src/pages/cp/subscription.ts:76:      { key: "tenants", label: "Tenants", sortable: true }
src/pages/cp/subscription.ts:99:    { key: "amount", label: "Montant", sortable: true },
src/__tests__/ui-entitlements-pages.contract.test.ts:6:  it("dashboard page references getEntitlementsForTenant via _shared/entitlements facade", () => {
src/__tests__/ui-entitlements-pages.contract.test.ts:10:    expect(src.includes("getEntitlementsForTenant")).toBe(true);
src/__tests__/ui-entitlements-pages.contract.test.ts:14:  it("users page references getEntitlementsForTenant via _shared/entitlements facade", () => {
src/__tests__/ui-entitlements-pages.contract.test.ts:18:    expect(src.includes("getEntitlementsForTenant")).toBe(true);
src/pages/cp/dashboard.ts:158:      title: "Santé système",
src/pages/cp/dashboard.ts:248:      title: "Incidents & Santé",
src/core/entitlements/resolve.ts:1:import { getTenantId } from "../runtime/tenant";
src/core/entitlements/resolve.ts:4:import { getEnabledPagesForPlan } from "../ssot/tenantMatrixLoader";
src/core/entitlements/resolve.ts:6:export function hasEntitlement(entitlement: string, tenantId = "local"): boolean {
src/core/entitlements/resolve.ts:7:  const e = loadEntitlements(tenantId);
src/core/entitlements/resolve.ts:13:/** Phase 2.3–2.4: la route (route_id) est-elle dans enabled_pages du plan du tenant? */
src/core/entitlements/resolve.ts:14:export function isPageEnabledForTenant(routeId: string, tenantId?: string): boolean {
src/core/entitlements/resolve.ts:15:  const t = tenantId ?? getTenantId();
src/pages/cp/users.ts:28:  { username: "ops.lead", role: "ADMIN", status: "ACTIVE", lastLogin: "2024-10-18 07:42", permissions: ["system:read", "tenants:govern", "flags:govern"] },
src/__tests__/control-plane-forcedflags-audit.contract.test.ts:22:      __tenant: "default",
src/__tests__/control-plane-forcedflags-audit.contract.test.ts:43:    const runtime: any = { __tenant: "default" };
src/__tests__/control-plane-forcedflags-audit.contract.test.ts:54:      __tenant: "default",
src/__tests__/control-plane-audit-schema-version.contract.test.ts:6:    const runtime: any = { __tenant: "default" };
src/__tests__/control-plane-audit-schema-version.contract.test.ts:12:    const runtime: any = { __tenant: "default" };
src/__tests__/feature-flags-boot.contract.test.ts:6:    const out = buildFeatureFlagsBootOutcome(undefined, { tenant: "t1" });
src/__tests__/feature-flags-boot.contract.test.ts:14:    const out = buildFeatureFlagsBootOutcome({ flags: { "x.demo": { state: "ON" } } }, { tenant: "t1" });
src/pages/cp/entitlements.ts:28:  { key: "pro.analytics", plan: "PRO", status: "ACTIVE", owner: "CP", expiresAt: "2025-02-12", scope: "tenant" },
src/pages/cp/entitlements.ts:30:  { key: "pro.audit", plan: "PRO", status: "ACTIVE", owner: "Governance", expiresAt: "2024-12-10", scope: "tenant" },
src/pages/cp/entitlements.ts:31:  { key: "trial.feature-x", plan: "FREE", status: "EXPIRED", owner: "CP", expiresAt: "2024-07-05", scope: "tenant" },
src/pages/cp/entitlements.ts:32:  { key: "legacy.reports", plan: "FREE", status: "INACTIVE", owner: "CP", expiresAt: "—", scope: "tenant" },
src/pages/cp/entitlements.ts:34:  { key: "pro.export", plan: "PRO", status: "ACTIVE", owner: "CP", expiresAt: "2025-05-18", scope: "tenant" },
src/pages/cp/login.ts.bak.20260128_142420:51:          Accès sécurisé au système d'administration. Entrez vos identifiants pour continuer.
src/pages/cp/login.ts.bak.20260128_142420:125:    // Désactiver le bouton pendant l'authentification
src/pages/cp/login.ts.bak.20260128_142420:134:      setMessage(result.error || "Identifiants invalides.", true);
src/pages/cp/login.ts.bak.20260128_142420:144:    setMessage(`Connecté en tant que ${result.session.username} (${result.session.role}). Redirection...`, false);
src/core/entitlements/index.ts:1:import { getTenantId } from "../runtime/tenant";
src/core/entitlements/index.ts:14:export { hasEntitlement, isPageEnabledForTenant } from "./resolve";
src/core/entitlements/index.ts:29:  return loadEntitlements(getTenantId());
src/core/entitlements/index.ts:39:    saveEntitlements(cmd.tenantId, next);
src/core/entitlements/index.ts:67:  const tenantId = getTenantId();
src/core/entitlements/index.ts:69:    saveEntitlements(tenantId, e);
src/core/entitlements/index.ts:75:    tenantId,
src/core/entitlements/index.ts:86:        tenant_id: tenantId,
src/core/entitlements/index.ts:90:      saveEntitlements(tenantId, e);
src/core/entitlements/index.ts:95:      tenant_id: tenantId,
src/core/entitlements/index.ts:99:    saveEntitlements(tenantId, e);
src/router.ts.bak.20260128_131439:15:// Generated guards from SSOT (3 variants for different contexts)
src/router.ts.bak.20260128_131439:47:// CP: décommissionner définitivement #/home-cp au bootstrap (avant résolution/rendu)
src/router.ts.bak.20260128_131439:94:  | "tenants_cp" | "entitlements_cp" | "pages_cp" | "feature-flags_cp" | "publish_cp" | "audit_cp" | "subscription_cp" | "integrations_cp"
src/router.ts.bak.20260128_131439:195:    if (seg === "tenants") return "tenants_cp";
src/router.ts.bak.20260128_131439:244:    if (seg === "tenants") return "tenants_cp";
src/__tests__/entitlements-api.contract.test.ts:2:import { getEntitlementsForTenant } from "../core/subscription/entitlementsApi";
src/__tests__/entitlements-api.contract.test.ts:6:    const out = await getEntitlementsForTenant("t1", "2026-01-11T00:00:00.000Z");
src/pages/cp/registry.ts.bak.20260128_125933:49:  tenants_cp: {
src/pages/cp/registry.ts.bak.20260128_125933:50:    routeId: "tenants_cp",
src/pages/cp/registry.ts.bak.20260128_125933:52:      // Page CP Tenants (composants visuels core)
src/pages/cp/registry.ts.bak.20260128_125933:53:      const m = await import("./tenants");
src/pages/cp/registry.ts.bak.20260128_125933:54:      await m.renderTenants(root);
src/pages/cp/registry.ts.bak.20260128_125933:61:      // Page CP Entitlements (composants visuels core)
src/pages/cp/registry.ts.bak.20260128_125933:70:      // Page CP Pages Registry (composants visuels core)
src/pages/cp/registry.ts.bak.20260128_125933:79:      // Page CP Feature Flags (composants visuels core)
src/pages/cp/registry.ts.bak.20260128_125933:88:      // Page CP Publish Center (composants visuels core)
src/core/write-gateway/auditHook.ts:6:  tenantId: string;
src/core/write-gateway/auditHook.ts:24:        tenant_id: entry.tenantId,
src/pages/cp/registry.ts:47:  tenants_cp: {
src/pages/cp/registry.ts:48:    routeId: "tenants_cp",
src/pages/cp/registry.ts:50:      // Page CP Tenants (composants visuels core)
src/pages/cp/registry.ts:51:      const m = await import("./tenants");
src/pages/cp/registry.ts:52:      await m.renderTenants(root);
src/pages/cp/registry.ts:59:      // Page CP Entitlements (composants visuels core)
src/pages/cp/registry.ts:68:      // Page CP Pages Registry (composants visuels core)
src/pages/cp/registry.ts:77:      // Page CP Feature Flags (composants visuels core)
src/pages/cp/registry.ts:86:      // Page CP Publish Center (composants visuels core)
src/__tests__/runtime-config-endpoint.shim.flag-on.contract.test.ts:30:    expect(json).toHaveProperty("tenant_id");
src/router.ts.bak.20260128_125000:15:// Generated guards from SSOT (3 variants for different contexts)
src/router.ts.bak.20260128_125000:82:  | "tenants_cp" | "entitlements_cp" | "pages_cp" | "feature-flags_cp" | "publish_cp" | "audit_cp" | "subscription_cp" | "integrations_cp"
src/router.ts.bak.20260128_125000:184:    if (seg === "tenants") return "tenants_cp";
src/router.ts.bak.20260128_125000:234:    if (seg === "tenants") return "tenants_cp";
src/__tests__/ui-entitlements-consumption.contract.test.ts:6:  it("Account page references getEntitlementsForTenant via _shared/entitlements facade", () => {
src/__tests__/ui-entitlements-consumption.contract.test.ts:10:    expect(src.includes("getEntitlementsForTenant")).toBe(true);
src/core/write-gateway/contracts.ts:11:  tenantId: string;
src/core/runtime/tenant.ts:2: * Tenant Context (v1)
src/core/runtime/tenant.ts:3: * - Default: "public" (single-tenant fallback)
src/core/runtime/tenant.ts:13:const TENANT_KEY = "icontrol.runtime.tenantId.v1";
src/core/runtime/tenant.ts:15:let tenantGateway: ReturnType<typeof createWriteGateway> | null = null;
src/core/runtime/tenant.ts:17:function resolveTenantGateway() {
src/core/runtime/tenant.ts:18:  if (tenantGateway) return tenantGateway;
src/core/runtime/tenant.ts:19:  tenantGateway = createWriteGateway({
src/core/runtime/tenant.ts:25:    }, "tenantShadowNoop"),
src/core/runtime/tenant.ts:28:  return tenantGateway;
src/core/runtime/tenant.ts:31:function isTenantShadowEnabled(): boolean {
src/core/runtime/tenant.ts:35:    if (Array.isArray(decisions)) return isEnabled(decisions, "tenant_shadow");
src/core/runtime/tenant.ts:37:    const state = flags?.tenant_shadow?.state;
src/core/runtime/tenant.ts:44:export function getTenantId(): string {
src/core/runtime/tenant.ts:54:export function setTenantId(id: string) {
src/core/runtime/tenant.ts:58:  if (!isTenantShadowEnabled()) return;
src/core/runtime/tenant.ts:60:  const correlationId = createCorrelationId("tenant");
src/core/runtime/tenant.ts:63:    tenantId: v,
src/core/runtime/tenant.ts:65:    payload: { tenantId: v },
src/core/runtime/tenant.ts:66:    meta: { shadow: true, source: "runtime.tenant", key: TENANT_KEY },
src/core/runtime/tenant.ts:70:    const res = resolveTenantGateway().execute(cmd as any);
src/core/runtime/tenant.ts:74:        tenant_id: v,
src/core/runtime/tenant.ts:82:      tenant_id: v,
src/core/write-gateway/policyHook.ts:19:        tenant_id: cmd.tenantId,
src/core/runtime/safeMode.ts:14:import { getTenantId } from "./tenant";
src/core/runtime/safeMode.ts:80:  const tenantId = (typeof getTenantId === "function" ? getTenantId() : "public") || "public";
src/core/runtime/safeMode.ts:84:    tenantId,
src/core/runtime/safeMode.ts:95:        tenant_id: tenantId,
src/core/runtime/safeMode.ts:103:      tenant_id: tenantId,
src/pages/cp/login.ts:51:          Accès sécurisé au système d'administration. Entrez vos identifiants pour continuer.
src/pages/cp/login.ts:125:    // Désactiver le bouton pendant l'authentification
src/pages/cp/login.ts:134:      setMessage(result.error || "Identifiants invalides.", true);
src/pages/cp/login.ts:144:    setMessage(`Connecté en tant que ${result.session.username} (${result.session.role}). Redirection...`, false);
src/core/entitlements/storage.ts:67:export function entitlementsKey(tenantId: string): string {
src/core/entitlements/storage.ts:68:  // tenantId must be stable identifier; if unknown, use "local".
src/core/entitlements/storage.ts:69:  const t = (tenantId || "local").trim();
src/core/entitlements/storage.ts:73:export function loadEntitlements(tenantId: string): Entitlements {
src/core/entitlements/storage.ts:75:  const raw = window.localStorage.getItem(entitlementsKey(tenantId));
src/core/entitlements/storage.ts:80:export function saveEntitlements(tenantId: string, e: Entitlements): void {
src/core/entitlements/storage.ts:83:  window.localStorage.setItem(entitlementsKey(tenantId), JSON.stringify(e));
src/core/entitlements/storage.ts:90:    tenantId,
src/core/entitlements/storage.ts:93:    meta: { shadow: true, source: "entitlements.storage", key: entitlementsKey(tenantId) },
src/core/entitlements/storage.ts:101:        tenant_id: tenantId,
src/core/entitlements/storage.ts:109:      tenant_id: tenantId,
src/core/entitlements/storage.ts:116:export function clearEntitlements(tenantId: string): void {
src/core/entitlements/storage.ts:119:  window.localStorage.removeItem(entitlementsKey(tenantId));
src/styles/STYLE_ADMIN_FINAL.css:59:  /* --- Tokens composants --- */
src/core/pagesInventory.ts.bak.20260128_142420:17:  tenant_visibility: string;
src/core/pagesInventory.ts.bak.20260128_142420:105:      tenants_cp: "app/src/pages/cp/tenants.ts",
src/__tests__/studio-runtime.safe-mode.factory.contract.test.ts:5:describe("SAFE_MODE factory invariant (contract)", () => {
src/__tests__/control-plane-featureflags-alias.contract.test.ts:6:    const runtime: any = { __tenant: "default" };
src/core/write-gateway/writeGateway.ts:36:    tenantId: String(cmd.tenantId || "").trim(),
src/core/write-gateway/writeGateway.ts:43:  if (!cmd.tenantId) return "ERR_WRITE_CMD_TENANT_REQUIRED";
src/core/write-gateway/writeGateway.ts:59:          tenant_id: cmd.tenantId,
src/core/write-gateway/writeGateway.ts:72:            tenant_id: cmd.tenantId,
src/core/write-gateway/writeGateway.ts:80:          tenant_id: cmd.tenantId,
src/core/write-gateway/writeGateway.ts:99:          tenant_id: cmd.tenantId,
src/core/write-gateway/writeGateway.ts:112:        tenantId: cmd.tenantId,
src/core/write-gateway/writeGateway.ts:125:          tenant_id: cmd.tenantId,
src/core/write-gateway/writeGateway.ts:133:        tenant_id: cmd.tenantId,
src/core/runtime/runtimeConfigEndpoint.ts:6: * SECURITY: ignores query params; derives tenant from client SSOT for local dev only.
src/core/runtime/runtimeConfigEndpoint.ts:10:import { getTenantId } from "./tenant";
src/core/runtime/runtimeConfigEndpoint.ts:13:  tenant_id: string;
src/core/runtime/runtimeConfigEndpoint.ts:78:        const tenantId = getTenantId();
src/core/runtime/runtimeConfigEndpoint.ts:82:          tenant_id: tenantId,
src/pages/cp/registry.ts.bak.20260128_125710:55:  tenants_cp: {
src/pages/cp/registry.ts.bak.20260128_125710:56:    routeId: "tenants_cp" as RouteId,
src/pages/cp/registry.ts.bak.20260128_125710:58:      // Page CP Tenants (composants visuels core)
src/pages/cp/registry.ts.bak.20260128_125710:59:      const m = await import("./tenants");
src/pages/cp/registry.ts.bak.20260128_125710:60:      await m.renderTenants(root);
src/pages/cp/registry.ts.bak.20260128_125710:67:      // Page CP Entitlements (composants visuels core)
src/pages/cp/registry.ts.bak.20260128_125710:76:      // Page CP Pages Registry (composants visuels core)
src/pages/cp/registry.ts.bak.20260128_125710:85:      // Page CP Feature Flags (composants visuels core)
src/pages/cp/registry.ts.bak.20260128_125710:94:      // Page CP Publish Center (composants visuels core)
src/__tests__/storage-namespace.contract.test.ts:4:import { setTenantId } from "../core/runtime/tenant";
src/__tests__/storage-namespace.contract.test.ts:37:test("audit log is namespaced by tenant", () => {
src/__tests__/storage-namespace.contract.test.ts:40:  setTenantId("tenantA");
src/__tests__/storage-namespace.contract.test.ts:46:  setTenantId("tenantB");
src/__tests__/storage-namespace.contract.test.ts:54:  setTenantId("tenantA");
src/__tests__/storage-namespace.contract.test.ts:61:  setTenantId("public");
src/core/subscription/entitlementsApi.ts:12:export async function getEntitlementsForTenant(tenantId: string, nowIso: string) {
src/core/subscription/entitlementsApi.ts:14:  const out = await svc.resolve(tenantId, nowIso);
src/core/subscription/entitlementsApi.ts:27:export async function getEntitlementsDiagnosticsForTenant(tenantId: string, nowIso?: string) {
src/core/subscription/entitlementsApi.ts:30:  const resolved = await svc.resolve(tenantId, now);
src/core/subscription/entitlementsApi.ts:32:    tenantId,
src/__tests__/cache-bounds-hardening.contract.test.ts:5:  it("ttlMs <= 0 => no-expiry semantics (cache persistant)", async () => {
src/__tests__/cache-bounds-hardening.contract.test.ts:24:    expect(v2).toBe(1); // cache persistant (no-expiry)
src/core/runtime/storageNs.ts:1:import { getTenantId } from "./tenant";
src/core/runtime/storageNs.ts:8:  const t = getTenantId();
src/__tests__/access-guard.contract.test.ts:5:import { setTenantId } from "../core/runtime/tenant";
src/__tests__/access-guard.contract.test.ts:42:  setTenantId("public");
src/__tests__/access-guard.contract.test.ts:61:  setTenantId("public");
src/__tests__/studio-runtime.mkRuntime.invariants.contract.test.ts:5:describe("mkRuntime invariants (contract)", () => {
src/pages/cp/tenants.ts:3: * Page Tenants — Gestion des tenants avec tableaux, KPI et graphiques
src/pages/cp/tenants.ts:5: * Utilise les mêmes composants visuels que l'APP (tableaux, KPI, toolbars)
src/pages/cp/tenants.ts:22:import { TenantService } from "../../core/control-plane/services/tenantService";
src/pages/cp/tenants.ts:25:import type { Tenant } from "../../core/control-plane/types";
src/pages/cp/tenants.ts:27:type TenantsData = {
src/pages/cp/tenants.ts:28:  tenants: Tenant[];
src/pages/cp/tenants.ts:60:export async function renderTenants(root: HTMLElement): Promise<void> {
src/pages/cp/tenants.ts:66:      subtitle: "Tenants — isolation, statut et santé",
src/pages/cp/tenants.ts:75:      description: "Récupération des données tenants"
src/pages/cp/tenants.ts:82:  const renderData = (data: TenantsData, errors: { tenants?: string }) => {
src/pages/cp/tenants.ts:87:      subtitle: "Tenants — isolation, statut et santé",
src/pages/cp/tenants.ts:95:          label: "➕ Demander un tenant",
src/pages/cp/tenants.ts:107:      { label: "Total tenants", value: formatNumber(data.kpi.total), tone: data.kpi.total > 0 ? "ok" : "neutral" },
src/pages/cp/tenants.ts:117:    // Tableau Tenants
src/pages/cp/tenants.ts:118:    const { card: tenantsCard, body: tenantsBody } = createSectionCard({
src/pages/cp/tenants.ts:119:      title: "Liste des Tenants",
src/pages/cp/tenants.ts:123:    if (errors.tenants) {
src/pages/cp/tenants.ts:124:      tenantsBody.appendChild(createErrorState({
src/pages/cp/tenants.ts:126:        message: errors.tenants
src/pages/cp/tenants.ts:128:      grid.appendChild(tenantsCard);
src/pages/cp/tenants.ts:135:    if (data.tenants.length === 0) {
src/pages/cp/tenants.ts:136:      tenantsBody.appendChild(createEmptyStateCard({
src/pages/cp/tenants.ts:137:        title: "Aucun tenant",
src/pages/cp/tenants.ts:138:        message: "Aucun tenant n'a été créé pour le moment.",
src/pages/cp/tenants.ts:140:          label: "Proposer un tenant",
src/pages/cp/tenants.ts:152:        searchPlaceholder: "Rechercher un tenant...",
src/pages/cp/tenants.ts:171:      tenantsBody.appendChild(toolbar);
src/pages/cp/tenants.ts:174:      tenantsBody.appendChild(tableContainer);
src/pages/cp/tenants.ts:176:      const columns: TableColumn<Tenant>[] = [
src/pages/cp/tenants.ts:177:        { key: "tenantId", label: "ID", sortable: true },
src/pages/cp/tenants.ts:193:          render: (value) => formatDateTime(formatTenantDate(value))
src/pages/cp/tenants.ts:199:            const limits = value as Tenant["limits"];
src/pages/cp/tenants.ts:205:      let selected: Tenant | null = data.tenants[0] || null;
src/pages/cp/tenants.ts:207:      const renderDetail = (tenant: Tenant | null) => {
src/pages/cp/tenants.ts:208:        const panel = createDetailsPanel(tenant);
src/pages/cp/tenants.ts:218:        let filtered = [...data.tenants];
src/pages/cp/tenants.ts:223:            t.tenantId.toLowerCase().includes(query) ||
src/pages/cp/tenants.ts:271:    grid.appendChild(tenantsCard);
src/pages/cp/tenants.ts:283:      const tenantService = new TenantService(storage, audit);
src/pages/cp/tenants.ts:285:      const tenants = await tenantService.listTenants();
src/pages/cp/tenants.ts:287:        total: tenants.length,
src/pages/cp/tenants.ts:288:        active: tenants.filter(t => t.status === "ACTIVE").length,
src/pages/cp/tenants.ts:289:        suspended: tenants.filter(t => t.status === "SUSPENDED").length,
src/pages/cp/tenants.ts:290:        inactive: tenants.filter(t => t.status === "INACTIVE").length
src/pages/cp/tenants.ts:293:      const demoTenants: Tenant[] = [
src/pages/cp/tenants.ts:294:        { tenantId: "alpha-hq", planId: "ENTERPRISE", status: "ACTIVE", createdAt: demoDate(), updatedAt: demoDate(), limits: { maxUsers: 1000, maxStorageGb: 2000, apiRateLimit: 100000 }, region: "eu-west", safeModePolicy: "COMPAT", retentionPolicy: "30D" },
src/pages/cp/tenants.ts:295:        { tenantId: "bravo-lab", planId: "PRO", status: "ACTIVE", createdAt: demoDate(), updatedAt: demoDate(), limits: { maxUsers: 120, maxStorageGb: 200, apiRateLimit: 50000 }, region: "us-east", safeModePolicy: "COMPAT", retentionPolicy: "30D" },
src/pages/cp/tenants.ts:296:        { tenantId: "charlie-gov", planId: "PRO", status: "SUSPENDED", createdAt: demoDate(), updatedAt: demoDate(), limits: { maxUsers: 80, maxStorageGb: 120, apiRateLimit: 25000 }, region: "eu-central", safeModePolicy: "STRICT", retentionPolicy: "90D" },
src/pages/cp/tenants.ts:297:        { tenantId: "delta-ops", planId: "FREE", status: "INACTIVE", createdAt: demoDate(), updatedAt: demoDate(), limits: { maxUsers: 8, maxStorageGb: 10, apiRateLimit: 2000 }, region: "apac", safeModePolicy: "OFF", retentionPolicy: "14D" },
src/pages/cp/tenants.ts:298:        { tenantId: "echo-edge", planId: "ENTERPRISE", status: "ACTIVE", createdAt: demoDate(), updatedAt: demoDate(), limits: { maxUsers: 1500, maxStorageGb: 2500, apiRateLimit: 200000 }, region: "us-west", safeModePolicy: "COMPAT", retentionPolicy: "365D" }
src/pages/cp/tenants.ts:300:      const finalTenants = tenants.length === 0 && isCpDemoEnabled() ? demoTenants : tenants;
src/pages/cp/tenants.ts:301:      const finalKpi = finalTenants.length === 0 ? kpi : {
src/pages/cp/tenants.ts:302:        total: finalTenants.length,
src/pages/cp/tenants.ts:303:        active: finalTenants.filter(t => t.status === "ACTIVE").length,
src/pages/cp/tenants.ts:304:        suspended: finalTenants.filter(t => t.status === "SUSPENDED").length,
src/pages/cp/tenants.ts:305:        inactive: finalTenants.filter(t => t.status === "INACTIVE").length
src/pages/cp/tenants.ts:309:        tenants: finalTenants,
src/pages/cp/tenants.ts:315:        tenants: [],
src/pages/cp/tenants.ts:318:      }, { tenants: String(e) });
src/pages/cp/tenants.ts:326:  function createDetailsPanel(tenant: Tenant | null): HTMLElement {
src/pages/cp/tenants.ts:328:      title: "Détails du tenant",
src/pages/cp/tenants.ts:332:    if (!tenant) {
src/pages/cp/tenants.ts:334:        title: "Aucun tenant sélectionné",
src/pages/cp/tenants.ts:335:        message: "Sélectionnez un tenant pour afficher les détails."
src/pages/cp/tenants.ts:340:    body.appendChild(createKpiRow("Tenant ID", tenant.tenantId));
src/pages/cp/tenants.ts:341:    body.appendChild(createKpiRow("Plan", tenant.planId));
src/pages/cp/tenants.ts:342:    body.appendChild(createKpiRow("Statut", tenant.status, tenant.status === "ACTIVE" ? "ok" : tenant.status === "SUSPENDED" ? "err" : "warn"));
src/pages/cp/tenants.ts:343:    body.appendChild(createKpiRow("Créé", formatDateTime(formatTenantDate(tenant.createdAt))));
src/pages/cp/tenants.ts:344:    body.appendChild(createKpiRow("Mis à jour", formatDateTime(formatTenantDate(tenant.updatedAt))));
src/pages/cp/tenants.ts:368:function formatTenantDate(value: unknown): string {
src/__tests__/cache-audit-snapshot-guarantee.contract.test.ts:4:describe("cache audit snapshot (guarantee)", () => {
src/__tests__/cache-audit-snapshot-guarantee.contract.test.ts:7:    const v = await cacheGetOrCompute(rt, "k:audit:guarantee", async () => 1, { ttlMs: 50 });
src/core/runtime/runtimeConfig.ts:7:import { getTenantId } from "./tenant";
src/core/runtime/runtimeConfig.ts:10:  tenant_id: string;
src/core/runtime/runtimeConfig.ts:60:    tenant_id: "local",
src/core/runtime/runtimeConfig.ts:93:  const tenantId = getTenantId();
src/core/runtime/runtimeConfig.ts:98:    tenantId,
src/core/runtime/runtimeConfig.ts:109:        tenant_id: tenantId,
src/core/runtime/runtimeConfig.ts:117:      tenant_id: tenantId,
src/__tests__/subscription-kernel.contract.test.ts:7:    const out = resolveEntitlements({ tenantId: "t1", subscription: null, nowIso: "2026-01-11T00:00:00.000Z" });
src/__tests__/subscription-kernel.contract.test.ts:16:      tenantId: "t1",
src/__tests__/subscription-kernel.contract.test.ts:22:    const out = resolveEntitlements({ tenantId: "t1", subscription: sub, nowIso: "2026-01-11T00:00:00.000Z" });
src/__tests__/subscription-kernel.contract.test.ts:29:      tenantId: "t1",
src/__tests__/subscription-kernel.contract.test.ts:36:    const out = resolveEntitlements({ tenantId: "t1", subscription: sub, nowIso: "2026-01-11T00:00:00.000Z" });
src/__tests__/subscription-kernel.contract.test.ts:43:      tenantId: "t1",
src/__tests__/subscription-kernel.contract.test.ts:50:    const out = resolveEntitlements({ tenantId: "t1", subscription: sub, nowIso: "2026-01-11T00:00:00.000Z" });
src/policies/feature_flags.boot.ts:12:export function buildFeatureFlagsBootOutcome(override?: unknown, ctx?: { tenant?: string; seed?: string }): FeatureFlagsBootOutcome {
src/policies/feature_flags.boot.ts:14:  const tenant = (ctx?.tenant || "default").trim() || "default";
src/policies/feature_flags.boot.ts:15:  const decisions = evaluateFeatureFlags(loaded.flags, { tenant, seed: ctx?.seed });
src/core/subscription/registryApi.ts:9:  tenantId: string;
src/core/subscription/registryApi.ts:17:    tenantId: args.tenantId,
src/core/subscription/registryApi.ts:25:  await svc.resolve(args.tenantId, args.startedAtIso);
src/core/subscription/registryApi.ts:29:  tenantId: string;
src/core/subscription/registryApi.ts:34:  await reg.cancel({ tenantId: args.tenantId, canceledAt: args.canceledAtIso });
src/core/subscription/registryApi.ts:37:  await svc.resolve(args.tenantId, args.canceledAtIso);
src/core/ssot/tenantMatrixLoader.ts:2: * tenantMatrixLoader — TENANT_FEATURE_MATRIX (config/ssot).
src/core/runtime/versionGate.ts:4: * "Update Required" dans mount si blocage. Pour l’instant: allow.
src/policies/feature_flags.default.json:15:    "tenant_shadow": {
src/core/pagesInventory.ts:17:  tenant_visibility: string;
src/core/pagesInventory.ts:105:      tenants_cp: "app/src/pages/cp/tenants.ts",
src/core/ssot/tenantMatrixLoader.ts.bak.20260128_142420:2: * tenantMatrixLoader — TENANT_FEATURE_MATRIX (config/ssot).
src/__tests__/subscription-registry.contract.test.ts:6:import { getEntitlementsForTenant } from "../core/subscription/entitlementsApi";
src/__tests__/subscription-registry.contract.test.ts:29:      tenantId: "t_reg",
src/__tests__/subscription-registry.contract.test.ts:35:    const out = await getEntitlementsForTenant(
src/__tests__/subscription-registry.contract.test.ts:44:      tenantId: "t_reg",
src/__tests__/subscription-registry.contract.test.ts:48:    const out = await getEntitlementsForTenant(
src/core/studio/rules/types.ts:7:  // Evolve later: tenant, flags, environment, etc.
src/core/audit/auditLog.ts:9:import { getTenantId } from "../runtime/tenant";
src/core/audit/auditLog.ts:89:  const tenantId = getTenantId();
src/core/audit/auditLog.ts:93:    tenantId,
src/core/audit/auditLog.ts:104:        tenant_id: tenantId,
src/core/audit/auditLog.ts:112:      tenant_id: tenantId,
src/core/utils/dateFormat.ts:57:  if (diffMin < 1) return "à l'instant";
src/policies/feature_flags.enforce.ts:19:  tenant: string;
src/policies/feature_flags.enforce.ts:33:function bucket100(tenant: string, key: string, seed?: string): number {
src/policies/feature_flags.enforce.ts:34:  const v = fnv1a32(`${tenant}::${key}::${seed || ""}`);
src/policies/feature_flags.enforce.ts:53:  const b = bucket100(ctx.tenant || "unknown", key, ctx.seed);
src/core/theme/themeTokens.ts:4: * Les valeurs viennent d’un resolver (brand/experience/tenant/preview), puis apply().
src/core/theme/applyThemeCssVars.ts:5: * IMPORTANT: aucun composant ne doit hardcoder des couleurs.
src/policies/cache.registry.ts:142: * Dormant subscription point:
src/policies/cache.registry.ts:439:    // P1.4 guarantee: snapshot() always present + runtime exposure (best-effort)
src/policies/trace.context.ts:18:  tenant: string;
src/policies/trace.context.ts:26:      return { tenant: "default", traceId: genId("trace"), requestId: genId("req") };
src/policies/trace.context.ts:31:      const tenant = String(existing.tenant || rt.__tenant || "default");
src/policies/trace.context.ts:34:      const ctx = { tenant, traceId, requestId };
src/policies/trace.context.ts:39:    const tenant = String(rt.__tenant || "default");
src/policies/trace.context.ts:40:    const ctx = { tenant, traceId: genId("trace"), requestId: genId("req") };
src/policies/trace.context.ts:44:    return { tenant: "default", traceId: genId("trace"), requestId: genId("req") };
src/policies/control_plane.runtime.ts:84:    tenant: String(w?.__tenant || "default"),
src/policies/control_plane.runtime.ts:88:    tenant: String(w?.__tenant || "default"),
src/main.ts.bak.20260128_142710:256:    const hashWantsCp =
src/main.ts.bak.20260128_142710:260:    const hashWantsApp = hashPath.startsWith("/app");
src/main.ts.bak.20260128_142710:270:    if (pathIsApp && hashWantsCp) {
src/main.ts.bak.20260128_142710:274:    if (pathIsCp && hashWantsApp) {
src/main.ts.bak.20260128_142710:279:    const wantsCp = pathIsCp || hashWantsCp;
src/main.ts.bak.20260128_142710:280:    const wantsApp = pathIsApp || hashWantsApp;
src/main.ts.bak.20260128_142710:283:    if (kind === "APP" && wantsCp) {
src/main.ts.bak.20260128_142710:291:    if (kind === "CP" && wantsApp) {
src/main.ts.bak.20260128_142710:573:        shellRoot: root ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak.20260128_142710:574:        shellMain: main ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak.20260128_142710:575:        burger: burger ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak.20260128_142710:576:        drawer: drawer ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak.20260128_142710:626:  // Protection: vérifier que le shell est monté avant de rendre la page
src/main.ts.bak.20260128_142710:709:    // ICONTROL_VERSION_GATE_V1: Vérifier compatibilité des versions avant de continuer
src/policies/audit.emit.ts:39:      module: "control_plane", tenant: ctx.tenant, traceId: ctx.traceId, requestId: ctx.requestId,
src/core/studio/blueprints/validate.ts:3: * - Validates only high-signal invariants to keep blast-radius minimal.
src/router.ts.bak.20260128_131021:15:// Generated guards from SSOT (3 variants for different contexts)
src/router.ts.bak.20260128_131021:82:  | "tenants_cp" | "entitlements_cp" | "pages_cp" | "feature-flags_cp" | "publish_cp" | "audit_cp" | "subscription_cp" | "integrations_cp"
src/router.ts.bak.20260128_131021:183:    if (seg === "tenants") return "tenants_cp";
src/router.ts.bak.20260128_131021:232:    if (seg === "tenants") return "tenants_cp";
src/policies/feature_flags.runtime.ts:5:function tryGetTenant(w: AnyWin): string {
src/policies/feature_flags.runtime.ts:6:  // Best-effort tenant source; stays offline and read-only.
src/policies/feature_flags.runtime.ts:7:  // If your tenant namespace provider exposes something else later, we can adapt without refactor.
src/policies/feature_flags.runtime.ts:8:  return String(w?.__tenant || w?.tenant || w?.TENANT || "default");
src/policies/feature_flags.runtime.ts:17:  const tenant = tryGetTenant(w);
src/policies/feature_flags.runtime.ts:18:  const out = buildFeatureFlagsBootOutcome(override, { tenant });
src/main.ts.bak_20260128_165957.bak_20260128_165957:257:    const hashWantsCp =
src/main.ts.bak_20260128_165957.bak_20260128_165957:261:    const hashWantsApp = hashPath.startsWith("/app");
src/main.ts.bak_20260128_165957.bak_20260128_165957:271:    if (pathIsApp && hashWantsCp) {
src/main.ts.bak_20260128_165957.bak_20260128_165957:275:    if (pathIsCp && hashWantsApp) {
src/main.ts.bak_20260128_165957.bak_20260128_165957:280:    const wantsCp = pathIsCp || hashWantsCp;
src/main.ts.bak_20260128_165957.bak_20260128_165957:281:    const wantsApp = pathIsApp || hashWantsApp;
src/main.ts.bak_20260128_165957.bak_20260128_165957:284:    if (kind === "APP" && wantsCp) {
src/main.ts.bak_20260128_165957.bak_20260128_165957:292:    if (kind === "CP" && wantsApp) {
src/main.ts.bak_20260128_165957.bak_20260128_165957:574:        shellRoot: root ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak_20260128_165957.bak_20260128_165957:575:        shellMain: main ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak_20260128_165957.bak_20260128_165957:576:        burger: burger ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak_20260128_165957.bak_20260128_165957:577:        drawer: drawer ? "✅ Trouvé" : "❌ Manquant",
src/main.ts.bak_20260128_165957.bak_20260128_165957:627:  // Protection: vérifier que le shell est monté avant de rendre la page
src/main.ts.bak_20260128_165957.bak_20260128_165957:710:    // ICONTROL_VERSION_GATE_V1: Vérifier compatibilité des versions avant de continuer
src/policies/README.md:9:- **Sémantique**: un kill-switch **désactive** un comportement, sans casser le flux fonctionnel.
src/policies/README.md:39:## Invariants & Runtime Flags
src/policies/README.md:41:### Sémantiques contract (cache)
src/policies/README.md:42:- **ttlMs <= 0** : sémantique **no-expiry** (l’entrée est persistante tant qu’elle n’est pas invalidée / évincée).
src/policies/README.md:59:- Toute extension “provider externe” doit rester **derrière un contrat** (ex: CacheProvider) et conserver ces invariants.
src/policies/README.md:62:## SWR (stale-while-revalidate) — invariants (contract)
src/policies/README.md:64:### Semantics
src/core/studio/runtime/plan.test.ts:80:  it("does not stringify valid text blocks (anti-regression)", () => {
src/core/studio/runtime/plan.ts:141:       Goal: if upstream parsing misses doc.data.blocks, recover in a tolerant, low-risk way.
src/core/studio/runtime/plan.ts:206:    // 4) Final fallback (guaranteed non-empty output)
src/core/ui/themeManager.ts:19:import { getTenantId } from "../runtime/tenant";
src/core/ui/themeManager.ts:270:    const tenantId = getTenantId();
src/core/ui/themeManager.ts:273:      tenantId,
src/core/ui/themeManager.ts:284:          tenant_id: tenantId,
src/core/ui/themeManager.ts:292:        tenant_id: tenantId,
src/core/ui/dataTable.ts:265:    nextBtn.textContent = "Suivant";
src/core/ui/catalog/index.ts.bak_20260128_155413:9:import { getTenantId } from "../../runtime/tenant";
src/core/ui/catalog/index.ts.bak_20260128_155413:92:  const tenantId = (typeof getTenantId === "function" ? getTenantId() : "public") || "public";
src/core/ui/catalog/index.ts.bak_20260128_155413:96:    tenantId,
src/core/ui/catalog/index.ts.bak_20260128_155413:107:        tenant_id: tenantId,
src/core/ui/catalog/index.ts.bak_20260128_155413:115:      tenant_id: tenantId,
src/core/ui/toolbar.ts:70:        variant: action.primary ? "primary" : "secondary",
src/core/ui/sectionCard.ts:71:        variant: action.primary ? "primary" : "secondary",
src/core/ui/confirmModal.ts:80:    const cancelBtn = createButton({ label: cancelLabel, variant: "secondary", size: "default", onClick: () => { hide(); onCancel(); } });
src/core/ui/confirmModal.ts:83:      variant: danger ? "danger" : "primary",
src/core/ui/pageShell.ts:87:        variant: action.primary ? "primary" : "secondary",
src/core/ui/catalog/index.ts:9:import { getTenantId } from "../../runtime/tenant";
src/core/ui/catalog/index.ts:92:  const tenantId = (typeof getTenantId === "function" ? getTenantId() : "public") || "public";
src/core/ui/catalog/index.ts:96:    tenantId,
src/core/ui/catalog/index.ts:107:        tenant_id: tenantId,
src/core/ui/catalog/index.ts:115:      tenant_id: tenantId,
src/core/ui/catalog/index.ts.bak_controlx_20260128_150958:9:import { getTenantId } from "../../runtime/tenant";
src/core/ui/catalog/index.ts.bak_controlx_20260128_150958:92:  const tenantId = (typeof getTenantId === "function" ? getTenantId() : "public") || "public";
src/core/ui/catalog/index.ts.bak_controlx_20260128_150958:96:    tenantId,
src/core/ui/catalog/index.ts.bak_controlx_20260128_150958:107:        tenant_id: tenantId,
src/core/ui/catalog/index.ts.bak_controlx_20260128_150958:115:      tenant_id: tenantId,
src/core/ui/emptyState.ts:77:      variant: "secondary",
src/core/ui/emptyState.ts:93:      variant: "primary",
src/core/ui/emptyState.ts:130:      variant: "secondary",
src/core/ui/registry.ts:3: * Objectif: inventorier les composants UI partagés + leurs classes canoniques,
src/core/ui/registry.ts:7: * - Chaque composant doit avoir un "id" stable et une "classBase" canonique.
src/core/ui/button.ts:5:export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
src/core/ui/button.ts:10:  variant?: ButtonVariant;
src/core/ui/button.ts:22:    variant = "secondary",
src/core/ui/button.ts:37:  const variantClass = `ic-btn--${variant}`;
src/core/ui/button.ts:39:  btn.className = [baseClass, variantClass, sizeClass].join(" ");
src/core/ui/charts.ts:201: * Nom sémantique pour tendances / volumes (style Enterprise).

## E) Entrypoints React/Vite (main/index + createRoot)
src/__tests__/ui-entitlements-consumption.contract.test.ts:8:    const target = path.join(repo, "modules/core-system/ui/frontend-ts/pages/account/index.ts");
src/__tests__/ui-entitlements-pages.contract.test.ts:16:    const target = path.join(repo, "modules/core-system/ui/frontend-ts/pages/users/index.ts");
src/__tests__/runtime-config-endpoint.shim.flag-off-default.contract.test.ts:20:    // simulate absence of flag: main.ts guard prevents registration; so fetch stays untouched
src/core/utils/types.ts:2: * Minimal runtime-safe shims used by app/src/main.ts.
src/__tests__/runtime-config-endpoint.shim.flag-on.contract.test.ts:21:    // register directly (equivalent to main.ts guard path when VITE_RUNTIME_CONFIG_SHIM=1)
src/core/theme/docs/README_THEME_SSOT.md:15:1) Dans le bootstrap (main.ts) : résoudre presetId (manifest + experience + preview)
