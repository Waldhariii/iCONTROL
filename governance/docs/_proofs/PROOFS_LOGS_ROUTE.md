# PROOFS - Route Logs (#/logs)

## 1) Logs page (SSOT UI)
Path:
- `modules/core-system/ui/frontend-ts/pages/logs/index.ts`

Public entry snippet:
```ts
export function renderLogsPage(root: HTMLElement): void {
  void renderLogsPageAsync(root);
}
```

## 2) Dispatch (#/logs -> renderLogsPage)
Path:
- `app/src/moduleLoader.ts`

Snippet:
```ts
if ((rid as any) === "logs") {
  // Logs: CP uniquement (administration)
  const appKind = getAppKind();
  if (appKind !== "CP") {
    root.innerHTML = `<div style="max-width:980px;margin:40px auto;padding:0 16px;opacity:.8">Page non disponible dans l'application client.</div>`;
    return;
  }
  import("../../modules/core-system/ui/frontend-ts/pages/logs")
    .then((m) => m.renderLogsPage(root))
```

## 3) Nav/Shell hash mapping
Path:
- `platform-services/ui-shell/layout/shell.ts`

Snippet:
```ts
{ id:"logs", label:"Logs", hash:"#/logs", show: ()=> isLoggedIn() && !isApp && canAccessPageRoute("logs") },
```

## 4) Dashboard CTA -> #/logs
Path:
- `app/src/pages/cp/dashboard.ts`

Snippet:
```ts
onClick: () => { window.location.hash = "#/logs"; }
```

## 5) Build status
Command:
- `npm run build:cp`

Result:
- OK (warnings only: existing chunk/dynamic import warnings)
