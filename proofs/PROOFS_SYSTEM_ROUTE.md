# PROOFS — Route System (CP) — #/system

## 1) Page System CP (fichier source)
- File: `./app/src/pages/cp/system.ts`
- Proof anchors:
  - `ICONTROL_CP_SYSTEM_V2`
  - `export function renderSystemPage(root: HTMLElement)`

## 2) Dispatch route #/system (montage)
- File: `./app/src/moduleLoader.ts`
- Proof anchor:
  - Branch: `if ((rid as any) === "system")`
  - CP/App split (CP: `renderSystemPageCp(root)`, App: `renderSystemPageApp(root)`)

## 3) Mapping navigation hash #/system (SSOT)
- File: `./app/src/core/ui/commandPalette.ts`
- Proof anchor:
  - `hash: "#/system"`

## 4) Call-sites renderSystemPage (référence)
- Expected callers (high-level):
  - moduleLoader.ts (dispatch)
  - system.ts (export)
  - tests (index.test.ts / etc.)

## 5) Build
- Command: `npm run build:cp`
- Expected: OK (warnings chunk/dynamic import acceptés, pas d'erreur)
