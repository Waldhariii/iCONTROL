# PROOFS — Route Developer (CP) — #/developer

## 1) Page Developer CP (fichier source)
- File: `./modules/core-system/ui/frontend-ts/pages/developer/index.tsx`
- Proof anchors:
  - `ICONTROL_CP_DEVELOPER_V2`
  - `export function renderDeveloperPage(`

## 2) Dispatch route #/developer (montage)
- File: `./app/src/moduleLoader.ts`
- Proof anchor:
  - Branch: `if ((rid as any) === "developer")`

## 3) Mapping navigation hash #/developer (SSOT)
- File: `./app/src/core/ui/commandPalette.ts`
- Proof anchor:
  - `hash: "#/developer"`

## 4) Build
- Command: `npm run build:cp`
- Expected: OK (warnings Vite acceptes, pas d'erreur)
