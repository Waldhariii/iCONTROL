# iCONTROL — Recommendations Applied Report

Generated: 20260109_174741
Repo: iCONTROL (workspace root)
Scope: Apply all mandatory + strongly recommended items for SafeRender, runtime contracts, tests, gates, and Git discipline.

## Changes Applied (files + objective)

- app/src/core/studio/engine/internal/html-guards.test.ts
  - Expanded SafeRender regression tests (script, inline handlers in tags, javascript:, data:text/html, safe HTML, text false positives).
- app/src/core/studio/runtime/types.ts
  - Formalized RenderOp/RenderPlan contract with explicit props.
- app/src/core/studio/runtime/execute.ts
  - Enforced props usage for component ops; removed inline handler from builtin form HTML.
- app/src/core/studio/runtime/execute.test.ts
  - Added executePlan tests (text escaping, builtin rendering with props, registry props pass-through) + SafeRender block sanity.
- app/src/core/studio/runtime/plan.ts
  - Hardened block mapping order; prevented valid blocks from falling into JSON fallback; ensured props are carried.
- app/src/core/studio/runtime/plan.test.ts
  - Added compilePlan tests (text, table/form props, mixed valid/invalid blocks).
- .DS_Store
  - Removed from tracking; enforced Git discipline.

## Contracts Fixed (authoritative)

- RenderOp is fixed: { op: "text" | "component" } with explicit props on component ops only.
- Runtime flow remains single-path: Blueprint -> compilePlan -> RenderPlan -> executePlan -> safeRender -> HTML.
- Builtins must emit deterministic, SafeRender-compliant HTML (no inline handlers).

## SafeRender Patterns (enforced + tests)

- Blocked patterns:
  - <script>
  - inline on* handlers inside HTML tags only (/<[^>]*\bon\w+\s*=/i)
  - javascript:
  - data:text/html
- Regression tests confirm:
  - unsafe content is blocked
  - harmless text mentioning onclick= is allowed
  - safe minimal HTML is accepted

## Gates & Runbooks

- Gates required per commit: audit-no-leaks + build + tests.
- Vitest is configured to run non-interactively via npm test.

## Remaining Risks / Debt

- No explicit debt accepted. Any future debt must be documented with scope and expiry.
