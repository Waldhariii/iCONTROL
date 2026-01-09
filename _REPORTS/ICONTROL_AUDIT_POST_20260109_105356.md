# iCONTROL — Audit & Purge iCONTROL

- Date: Fri Jan  9 10:53:56 EST 2026
- ROOT: `/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL`
- Backup: `/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_PURGE_CONTROLX_20260109_105356/root.bak`

## A) Audit PRE

### A1) Traces iCONTROL (case-insensitive)
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_UI_SHELL_NAV_20260108_225116/src.bak/main.ts:2:// ICONTROL_BRAND_TITLE_V1
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_UI_SHELL_NAV_20260108_225116/src.bak/main.ts:10:// END ICONTROL_BRAND_TITLE_V1
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_SETTINGS_MENU_20260108_224110/src.bak/main.ts:2:// ICONTROL_BRAND_TITLE_V1
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_SETTINGS_MENU_20260108_224110/src.bak/main.ts:10:// END ICONTROL_BRAND_TITLE_V1
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_REMOVE_CONTROLX_20260109_102941/_REPORTS/_BK_UI_SHELL_NAV_20260108_225116/src.bak/main.ts:2:// ICONTROL_BRAND_TITLE_V1
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_REMOVE_CONTROLX_20260109_102941/_REPORTS/_BK_UI_SHELL_NAV_20260108_225116/src.bak/main.ts:10:// END ICONTROL_BRAND_TITLE_V1
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_REMOVE_CONTROLX_20260109_102941/_REPORTS/_BK_SETTINGS_MENU_20260108_224110/src.bak/main.ts:2:// ICONTROL_BRAND_TITLE_V1
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_REMOVE_CONTROLX_20260109_102941/_REPORTS/_BK_SETTINGS_MENU_20260108_224110/src.bak/main.ts:10:// END ICONTROL_BRAND_TITLE_V1
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:1:# iCONTROL — Audit & Purge iCONTROL
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:5:- Backup: `/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_PURGE_CONTROLX_20260109_105356/root.bak`
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:9:### A1) Traces iCONTROL (case-insensitive)
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_UI_SHELL_MOUNT_GUARD_20260108_230647/main.ts.bak:4:// ICONTROL_BRAND_TITLE_V1
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_UI_SHELL_MOUNT_GUARD_20260108_230647/main.ts.bak:12:// END ICONTROL_BRAND_TITLE_V1
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_REMOVE_CONTROLX_20260109_102941/app/src/main.ts:4:// ICONTROL_BRAND_TITLE_V1
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_REMOVE_CONTROLX_20260109_102941/app/src/main.ts:12:// END ICONTROL_BRAND_TITLE_V1

### A2) Absolute path leaks (/Users/danygaudreault/...)
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:4:- ROOT: `/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL`
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:5:- Backup: `/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_PURGE_CONTROLX_20260109_105356/root.bak`
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:10:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_UI_SHELL_NAV_20260108_225116/src.bak/main.ts:2:// ICONTROL_BRAND_TITLE_V1
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:11:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_UI_SHELL_NAV_20260108_225116/src.bak/main.ts:10:// END ICONTROL_BRAND_TITLE_V1
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:12:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_SETTINGS_MENU_20260108_224110/src.bak/main.ts:2:// ICONTROL_BRAND_TITLE_V1
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:13:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_SETTINGS_MENU_20260108_224110/src.bak/main.ts:10:// END ICONTROL_BRAND_TITLE_V1
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:14:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_REMOVE_CONTROLX_20260109_102941/_REPORTS/_BK_UI_SHELL_NAV_20260108_225116/src.bak/main.ts:2:// ICONTROL_BRAND_TITLE_V1
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:15:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_REMOVE_CONTROLX_20260109_102941/_REPORTS/_BK_UI_SHELL_NAV_20260108_225116/src.bak/main.ts:10:// END ICONTROL_BRAND_TITLE_V1
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:16:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_REMOVE_CONTROLX_20260109_102941/_REPORTS/_BK_SETTINGS_MENU_20260108_224110/src.bak/main.ts:2:// ICONTROL_BRAND_TITLE_V1
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:17:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_REMOVE_CONTROLX_20260109_102941/_REPORTS/_BK_SETTINGS_MENU_20260108_224110/src.bak/main.ts:10:// END ICONTROL_BRAND_TITLE_V1
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:18:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:1:# iCONTROL — Audit & Purge iCONTROL
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:19:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:5:- Backup: `/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_PURGE_CONTROLX_20260109_105356/root.bak`
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:20:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:9:### A1) Traces iCONTROL (case-insensitive)
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:21:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_UI_SHELL_MOUNT_GUARD_20260108_230647/main.ts.bak:4:// ICONTROL_BRAND_TITLE_V1
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:22:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_UI_SHELL_MOUNT_GUARD_20260108_230647/main.ts.bak:12:// END ICONTROL_BRAND_TITLE_V1
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:23:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_REMOVE_CONTROLX_20260109_102941/app/src/main.ts:4:// ICONTROL_BRAND_TITLE_V1
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:24:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_REMOVE_CONTROLX_20260109_102941/app/src/main.ts:12:// END ICONTROL_BRAND_TITLE_V1
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:26:### A2) Absolute path leaks (/Users/danygaudreault/...)

### A3) /@fs leaks (must stay inside ROOT)
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/node_modules/vite/dist/node-cjs/publicUtils.cjs:21:const FS_PREFIX = `/@fs/`;
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:51039:    // like '/@fs/absolute/path/to/node_modules/.vite'
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:51040:    `/@fs/${removeLeadingSlash(normalizePath$3(depsCacheDir))}`
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/node_modules/vite/dist/node/constants.js:45:const FS_PREFIX = `/@fs/`;
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/node_modules/@vitest/utils/dist/source-map.js:782:  if (url.startsWith("/@fs/")) {
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/node_modules/@vitest/snapshot/dist/index.js:968:  if (url.startsWith("/@fs/")) {
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/node_modules/vite-node/dist/client.cjs:162:    const url = `/@fs/${utils.slash(pathe.resolve(file))}`;
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/node_modules/vite-node/dist/client.mjs:160:    const url = `/@fs/${slash(resolve(file))}`;
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/node_modules/vite-node/dist/utils.mjs:9:const driveRegexp = drive ? new RegExp(`(?:^|/@fs/)${drive}(:[\/])`) : null;
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/node_modules/vite-node/dist/utils.mjs:10:const driveOppositeRegext = driveOpposite ? new RegExp(`(?:^|/@fs/)${driveOpposite}(:[\/])`) : null;
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/node_modules/vite-node/dist/utils.mjs:64:    if (id.startsWith("/@fs/"))
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/node_modules/vite-node/dist/utils.cjs:11:const driveRegexp = drive ? new RegExp(`(?:^|/@fs/)${drive}(:[\/])`) : null;
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/node_modules/vite-node/dist/utils.cjs:12:const driveOppositeRegext = driveOpposite ? new RegExp(`(?:^|/@fs/)${driveOpposite}(:[\/])`) : null;
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/node_modules/vite-node/dist/utils.cjs:66:    if (id.startsWith("/@fs/"))
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_REMOVE_CONTROLX_20260109_102941/node_modules/@vitest/utils/dist/source-map.js:782:  if (url.startsWith("/@fs/")) {
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_REMOVE_CONTROLX_20260109_102941/node_modules/@vitest/snapshot/dist/index.js:968:  if (url.startsWith("/@fs/")) {
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_REMOVE_CONTROLX_20260109_102941/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:51039:    // like '/@fs/absolute/path/to/node_modules/.vite'
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_REMOVE_CONTROLX_20260109_102941/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:51040:    `/@fs/${removeLeadingSlash(normalizePath$3(depsCacheDir))}`
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_REMOVE_CONTROLX_20260109_102941/node_modules/vite/dist/node/constants.js:45:const FS_PREFIX = `/@fs/`;

OK: /@fs stays within ROOT

### A4) core-kernel must not import modules/
OK: core-kernel does not import modules

### A5) modules must not import other modules directly (heuristic)
OK: no obvious module->module direct references
=== C) AUDIT POST ===

## C) Audit POST

### C1) Remaining ControlX traces (should be empty or only in BK)
FAIL: ControlX traces still found:
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:5:- Backup: `/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_PURGE_CONTROLX_20260109_105356/root.bak`
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:14:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_REMOVE_CONTROLX_20260109_102941/_REPORTS/_BK_UI_SHELL_NAV_20260108_225116/src.bak/main.ts:2:// ICONTROL_BRAND_TITLE_V1
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:15:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_REMOVE_CONTROLX_20260109_102941/_REPORTS/_BK_UI_SHELL_NAV_20260108_225116/src.bak/main.ts:10:// END ICONTROL_BRAND_TITLE_V1
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:16:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_REMOVE_CONTROLX_20260109_102941/_REPORTS/_BK_SETTINGS_MENU_20260108_224110/src.bak/main.ts:2:// ICONTROL_BRAND_TITLE_V1
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:17:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_REMOVE_CONTROLX_20260109_102941/_REPORTS/_BK_SETTINGS_MENU_20260108_224110/src.bak/main.ts:10:// END ICONTROL_BRAND_TITLE_V1
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:19:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:5:- Backup: `/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_PURGE_CONTROLX_20260109_105356/root.bak`
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:23:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_REMOVE_CONTROLX_20260109_102941/app/src/main.ts:4:// ICONTROL_BRAND_TITLE_V1
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:24:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_REMOVE_CONTROLX_20260109_102941/app/src/main.ts:12:// END ICONTROL_BRAND_TITLE_V1
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:28:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:5:- Backup: `/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_PURGE_CONTROLX_20260109_105356/root.bak`
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:33:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:14:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_REMOVE_CONTROLX_20260109_102941/_REPORTS/_BK_UI_SHELL_NAV_20260108_225116/src.bak/main.ts:2:// ICONTROL_BRAND_TITLE_V1
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:34:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:15:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_REMOVE_CONTROLX_20260109_102941/_REPORTS/_BK_UI_SHELL_NAV_20260108_225116/src.bak/main.ts:10:// END ICONTROL_BRAND_TITLE_V1
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:35:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:16:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_REMOVE_CONTROLX_20260109_102941/_REPORTS/_BK_SETTINGS_MENU_20260108_224110/src.bak/main.ts:2:// ICONTROL_BRAND_TITLE_V1
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:36:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:17:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_REMOVE_CONTROLX_20260109_102941/_REPORTS/_BK_SETTINGS_MENU_20260108_224110/src.bak/main.ts:10:// END ICONTROL_BRAND_TITLE_V1
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:38:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:19:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:5:- Backup: `/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_PURGE_CONTROLX_20260109_105356/root.bak`
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:42:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:23:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_REMOVE_CONTROLX_20260109_102941/app/src/main.ts:4:// ICONTROL_BRAND_TITLE_V1
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:43:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:24:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_REMOVE_CONTROLX_20260109_102941/app/src/main.ts:12:// END ICONTROL_BRAND_TITLE_V1
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:61:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_REMOVE_CONTROLX_20260109_102941/node_modules/@vitest/utils/dist/source-map.js:782:  if (url.startsWith("/@fs/")) {
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:62:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_REMOVE_CONTROLX_20260109_102941/node_modules/@vitest/snapshot/dist/index.js:968:  if (url.startsWith("/@fs/")) {
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:63:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_REMOVE_CONTROLX_20260109_102941/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:51039:    // like '/@fs/absolute/path/to/node_modules/.vite'
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:64:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_REMOVE_CONTROLX_20260109_102941/node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js:51040:    `/@fs/${removeLeadingSlash(normalizePath$3(depsCacheDir))}`
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:65:/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/_BK_REMOVE_CONTROLX_20260109_102941/node_modules/vite/dist/node/constants.js:45:const FS_PREFIX = `/@fs/`;
/Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/_REPORTS/ICONTROL_AUDIT_POST_20260109_105356.md:78:### C1) Remaining ControlX traces (should be empty or only in BK)
