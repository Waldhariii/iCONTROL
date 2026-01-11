# Contributing to iCONTROL

iCONTROL is 100% free and open-source under Apache-2.0. Contributions are welcome, provided they preserve the security and architecture contracts.

## Non-negotiables (must hold after every change)

### Core isolation + SSOT pipeline
The Core Kernel remains strictly isolated. The only authorized flow is:

Blueprint → compilePlan → RenderPlan → executePlan → safeRender → HTML

No app→core inversion, no module→module coupling outside approved gateways.

### Runtime contracts
- `RenderOp` is contractually typed and stable: `text | component`.
- Extensions are **explicit** via `props` only.
- No fallback `JSON.stringify` may mask a valid block; valid blueprints must be handled deterministically.

### SafeRender (security gate)
SafeRender must remain strict and never permissive:
- Blocked patterns include: `<script>`, inline handlers `on*` in HTML tags, `javascript:`, `data:text/html`.
- No bypass via text/props.
- Any evolution requires regression tests (positive + negative) and must keep false positives under control.

### Builtins
Builtins output deterministic HTML that is 100% SafeRender-compliant:
- No inline event handlers.
- No uncontrolled dynamic logic.
- Each builtin is a mini UI contract (inputs validated, outputs escaped).

### Quality gates
No commit may bypass:
- `./scripts/audit/audit-no-leaks.zsh`
- `cd app && npm run build`
- `cd app && npm run test`

Any change in core requires at least one associated test.

## Workflow

### Branching + commits
- Make atomic, scoped commits: `core/*`, `app/*`, `docs/*`, `scripts/*`.
- Keep changes readable for audit and rollback.
- Prefer small PRs with explicit intent.

### Runbooks
- Core gate: `./gate-core.zsh` (or follow the documented gate flow)
- Dev: `cd app && npm run dev -- --port 5176` then open `#/runtime-smoke`

## Reporting / artifacts
Do not commit local OS artifacts (e.g., `.DS_Store`) or local build output. Reports should follow the repo policy (tracked only when explicitly required by governance).
