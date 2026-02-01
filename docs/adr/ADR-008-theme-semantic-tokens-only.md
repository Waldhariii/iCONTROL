# ADR-008 — Theme Manager uses semantic tokens only

Date: 2026-02-01  
Status: Accepted  
Owners: CTO / Platform

## Context
Hardcoded colors cause visual regressions, duplication, and make theme switching expensive.

## Decision
Theme is defined via semantic tokens (CSS vars) in `platform/theme/**`.
No new hardcoded colors; enforcement is warn-first, later strict.

## Rationale
Enables stable UI across APP/CP and future tenant overrides without refactors.

## Consequences
- (+) Stable theming and long-term maintainability
- (-) Requires gradual migration of existing hardcoded colors

## Enforcement
- gate:no-hardcoded-colors-warn (warn-first)
- future: strict gate + migration plan

## Rollback
Supersede with a different theming strategy, but must preserve semantic token principle.
