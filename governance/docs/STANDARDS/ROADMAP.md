# iCONTROL Roadmap (Open Source, 100% Free)

This roadmap converts the iCONTROL recommendations into a delivery sequence while preserving the security-first posture.

## Guiding principles
- Security > features: SafeRender remains the gate.
- Contracts > convenience: RenderPlan/RenderOp are stable.
- Isolation > coupling: Core stays isolated; modules plug in.

## Phase 0 — Baseline OSS (DONE)
- Apache-2.0 licensing (LICENSE/NOTICE)
- Canonical pipeline verified (compile → execute → safeRender)
- SafeRender denylist + regression tests
- Builtins SafeRender-compliant (no inline handlers)
- Gates standardized (audit/build/test)

## Phase 1 — Contract hardening (NEXT)
- Freeze a formal Runtime Contract doc (public, versioned)
- Expand compilePlan test matrix:
  - valid blocks (text/table/form)
  - invalid blocks (unknown types, malformed props)
  - anti-regressions (no valid block -> JSON fallback)
- Expand executePlan tests:
  - props propagation
  - builtin rendering determinism
  - registry resolution behavior

## Phase 2 — Governance + Observability
- Stable error/warn code registry with non-sensitive telemetry
- SAFE_MODE + RBAC policy enforcement:
  - explicit deny reasons
  - test coverage for allow/deny paths
- Runbook automation (doctor/new-feature/gate-core)

## Phase 3 — Platform scalability (still free)
- Multi-tenant readiness (namespaces, isolation, RBAC scopes)
- Stronger SAFE_MODE hardening
- Plugin lifecycle governance (versioning, compatibility rules)

## Phase 4 — UI evolution (only if security posture is preserved)
- Remain string-based while SafeRender is primary gate
- Any framework migration (React/Vue/etc.) must:
  - preserve RenderPlan contract
  - keep safeRender as a non-bypassable gate
  - maintain deterministic builtins
