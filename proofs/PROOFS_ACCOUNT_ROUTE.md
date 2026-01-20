# PROOFS — Route Account (CP) — #/account

## 1) Page Account CP (fichier source)
- File: `./app/src/pages/cp/account.ts`
- Proof anchors:
  - `ICONTROL_CP_ACCOUNT_V2`
  - `export function renderAccountPage(root: HTMLElement)`

## 2) Dispatch route #/account (montage)
- File: `./app/src/moduleLoader.ts`
- Proof anchor:
  - Branch: `if ((rid as any) === "account")`

## 3) Mapping navigation hash #/account
- File: `./app/src/core/layout/cpToolboxShell.ts`
- Proof anchor:
  - `navigate("#/account")`

## 4) Build
- Command: `npm run build:cp`
- Expected: OK (warnings chunk/dynamic import acceptes, pas d'erreur)
