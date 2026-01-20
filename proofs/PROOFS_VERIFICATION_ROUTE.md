# PROOFS — Route Verification (CP) — #/verification

## 1) Page Verification (source)
- File: `./modules/core-system/ui/frontend-ts/pages/verification/index.ts`
- Proof anchors:
  - `ICONTROL_CP_VERIFICATION_V2`
  - `createPageShell(` (SSOT V2)
  - export public `renderVerificationPage(`

## 2) Dispatch route #/verification
- File: `./app/src/moduleLoader.ts`
- Proof anchor:
  - Branch: `if ((rid as any) === "verification")`

## 3) Navigation SSOT (CommandPalette)
- File: `./app/src/core/ui/commandPalette.ts`
- Proof anchor:
  - `hash: "#/verification"`

## 4) Build
- Command: `npm run build:cp`
- Expected: OK (warnings Vite acceptes)
