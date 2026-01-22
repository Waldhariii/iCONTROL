# iCONTROL — System Analysis & SafeRender Hardening

- Generated: `20260109_170342`
- Root: `$ICONTROL`
- Scope: SafeRender contract + anti-regression tests + local gates

## Executive Summary

SafeRender is the last-mile HTML safety gate for the studio runtime (compilePlan -> executePlan -> safeRender -> renderRoute). The current guardrail set is intentionally minimal and already includes the canonical inline-handler pattern. The main regression risk is false positives on harmless text or bypass via HTML attributes and URI schemes. The added unit tests lock the contract around those cases, and local gates now enforce audit + build + test. ROI: reduced security regressions (P0) with low maintenance overhead and immediate CI/local confidence.

## Architecture Map (modules + responsibilities)

- App shell (`app/src`): routing, boot, runtime smoke UI, module loader.
- Core studio runtime (`app/src/core/studio/runtime`): blueprint compile + plan execution, string-based rendering.
- Engine (`app/src/core/studio/engine`): SafeRender wrapper + HTML guardrails.
- Registry (`app/src/core/studio/registry`): builtins + registry defaults/adapters.
- Core kernel (`core-kernel`, `core-kernel-ts`): shared system primitives (outside app runtime scope).
- Modules (`modules/*`): feature-specific UIs and domain functionality.
- Shared (`shared/*`, `ui-shell`, `runtime`): design system, shared UI host layers.

## End-to-End Flow (critical path)

1) `compilePlan` maps blueprint blocks into `RenderPlan` (text + component ops).
2) `executePlan` renders ops to HTML strings (builtins or registry components).
3) `safeRender` invokes HTML guards and returns safe HTML or a structured error.
4) `renderRoute` (app routing) places output in the UI shell.

## Critical Contracts

- SafeRender (`app/src/core/studio/engine/internal/html-guards.ts`):
  - Minimal denylist to avoid false positives.
  - Canonical inline handler block: `/<[^>]*\bon\w+\s*=/i`.
  - Blocks `script` tags and unsafe URI schemes (`javascript:`, `data:text/html`).
- compilePlan (`app/src/core/studio/runtime/plan.ts`):
  - Converts blueprint blocks to builtin component ids with props.
  - Must avoid emitting HTML directly (string-based runtime).
- executePlan (`app/src/core/studio/runtime/execute.ts`):
  - Renders builtins to HTML fragments and passes registry outputs through.
  - Must escape text content and keep builtins SafeRender-compliant.
- Registry (`app/src/core/studio/registry/*`):
  - Declares builtin component ids and default registry mapping.
  - Must avoid inline handlers or unsafe URL schemes.

## Builtins Inventory + HTML Attack Surface

- Builtins: `builtin.table`, `builtin.form`.
- Attack surface: attribute injection (on*), unsafe href/src schemes, embedded script tags.
- Current scan indicates no inline handler usage in builtins.

## Findings

### P0

- SafeRender contract was untested for false positives in text or unsafe HTML in tags. This is a regression vector for both security and DX.

### P1

- Local runbooks enforced audit + build but did not gate on tests; low confidence in safety regressions when changes land.

### P2

- Minimal guardrails are appropriate, but the absence of a documented gate or test runner behavior can lead to inconsistent local workflows.

## Actions Proposed (with commands)

- Add unit tests for SafeRender (inline handler blocking, javascript: URLs, text false positive).
  - `cd app && npm run test`
- Add vitest run + watch scripts in `app/package.json`.
- Extend runbook gates to include tests.
  - `./scripts/runbook/doctor.zsh`
  - `./scripts/runbook/new-feature.zsh <feature-name>`

## Verification

- `./scripts/audit/audit-no-leaks.zsh`
- `cd app && npm run build`
- `cd app && npm run test`

## Diff Summary

- Added SafeRender unit tests: `app/src/core/studio/engine/internal/html-guards.test.ts`.
- Updated app test scripts: `app/package.json`.
- Added test gate to runbooks: `scripts/runbook/doctor.zsh`, `scripts/runbook/new-feature.zsh`.
- Documented local gates: `scripts/runbook/README.md`.
