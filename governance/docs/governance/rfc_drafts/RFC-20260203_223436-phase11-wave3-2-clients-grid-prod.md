# RFC — Phase11 Wave3.2: Clients Grid Production-grade

## Goal
Upgrade Clients Grid to a production-grade, governed table (filter/sort/pagination + VFS schema/versioning) without breaking SSOT.

## Non-goals (explicit)
- No backend/server.
- No cross-module dependencies.
- No breaking changes to SSOT route catalog.

## Scope
1) UI: filters/sort/pagination states + empty/loading/error standard blocks.
2) VFS: schema versioning clients.v1 + fail-soft migration.
3) Governance: contract tests for clientsAdapter.vfs + anti-regression gate.

## Risks
- Perf: large client list -> require virtualization.
- Data drift: schema migrations -> must be fail-soft.

## Acceptance
- All gates GREEN
- build:app build:cp build:ssot GREEN
- VFS schema versioned and tested
