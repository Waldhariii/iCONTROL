# PROOFS — Route Network (CP) — #/network

## 1) Page Network CP (fichier source)
- File: `./app/src/pages/cp/network.ts`
- Proof anchors:
  - `ICONTROL_CP_NETWORK_V2`
  - `export function renderNetworkPage(root: HTMLElement)`

## 2) Dispatch route #/network (montage)
- File: `./app/src/moduleLoader.ts`
- Proof anchor:
  - Branch: `if ((rid as any) === "network")`

## 3) Mapping navigation hash #/network
- File: `./app/src/core/ui/commandPalette.ts`
- Proof anchor:
  - Entry: `{ id: "network", label: "Network", hash: "#/network" }`

## 4) Build
- Command: `npm run build:cp`
- Expected: OK (warnings chunk/dynamic import acceptés, pas d'erreur)
