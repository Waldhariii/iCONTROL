# PROOFS — Route API (CP) — #/api

## 1) Page API CP (fichier source)
- File: `./app/src/pages/cp/api.ts`
- Proof anchors:
  - `ICONTROL_CP_API_V2`
  - `export function renderApiPage(root: HTMLElement)`

## 2) Dispatch route #/api (montage)
- File: `./app/src/moduleLoader.ts`
- Proof anchor:
  - Branch: `if ((rid as any) === "api")`

## 3) Mapping navigation hash #/api
- File: `./app/src/core/ui/commandPalette.ts`
- Proof anchor:
  - Entry: `{ id: "api", label: "API", hash: "#/api" }`

## 4) Build
- Command: `npm run build:cp`
- Expected: OK (warnings chunk/dynamic import acceptés, pas d'erreur)
