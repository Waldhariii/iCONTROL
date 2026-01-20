# PROOFS — Route Developer Entitlements (CP) — #/developer/entitlements

## 1) Page CP (fichier source)
- File: `./modules/core-system/ui/frontend-ts/pages/developer/entitlements.tsx`
- Proof anchors:
  - `ICONTROL_CP_DEVELOPER_ENTITLEMENTS_V2`
  - `export function renderDeveloperEntitlementsPage(`

## 2) Dispatch route (montage)
- File: `./app/src/moduleLoader.ts`
- Proof anchor:
  - Branch: `if ((rid as any) === "developer_entitlements")`

## 3) Navigation SSOT (CommandPalette)
- File: `./app/src/core/ui/commandPalette.ts`
- Proof anchor:
  - `hash: "#/developer/entitlements"`

## 4) Build
- Command: `npm run build:cp`
- Expected: OK (warnings Vite acceptes, pas d'erreur)
