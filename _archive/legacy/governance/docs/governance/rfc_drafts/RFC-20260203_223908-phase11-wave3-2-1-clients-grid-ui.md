# RFC — PHASE11/WAVE3.2.1 Clients Grid UI (production-grade)

## Objective
Deliver a production-grade Clients Grid surface backed by clients.v1 port + VFS adapter, with perf-first behavior and fail-soft data drift handling.

## Scope (must ship)
- Grid MVP: columns + row actions
- Pagination/limit support (adapter-backed)
- Virtualization threshold (auto)
- UX: loading skeleton, empty state, error state
- Observability: correlationId propagation + safe metrics (no unbounded keys)

## Non-goals
- Advanced filtering DSL
- Export/print
- Offline mode

## Acceptance
- All tests GREEN
- build:app build:cp build:ssot GREEN
- Perf: large client list uses virtualization
- Data drift: schema migrations are fail-soft + emit evidence (warn code)
