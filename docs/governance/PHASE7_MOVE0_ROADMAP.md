# Phase 7 — Move0 Roadmap (Productization + Delivery Discipline)

## Strategic intent
Convert the Phase6 governance/SSOT foundation into an acceleration layer for:
- faster delivery with lower regression risk
- predictable releases (release-train discipline)
- catalog-driven UX onboarding and entitlements

## Outcomes (Move0)
1. Governance hygiene:
   - `_audit/` stays generated-only (untracked), enforced by gate + contract test
2. Roadmap artefact:
   - Phase7 scope and execution tracks documented

## Track A — Productization (CP)
- Catalog-driven navigation (done in Phase6) → expand into:
  - tenant onboarding wizard
  - module entitlements UI driven by catalog
  - surface registry consumption in CP menus/routes

## Track B — Release discipline
- Define release checklist:
  - gates order
  - tag-set-atomic as mandatory step
  - drift handling rules

## Track C — Performance & QA
- Define budgets:
  - bundle size threshold
  - startup time targets
- Strengthen contract-first:
  - invariants for catalog and ports

## Track D — Ops / Observability
- Reason codes → structured logs & dashboards (future module)
