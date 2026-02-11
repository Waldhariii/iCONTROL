# TITAN-3 — Tenant Compute Isolation

Objectif: prévenir noisy-neighbor et garantir QoS par tenant.

Livrables:
- core-kernel/src/tenant/computeGovernor.ts (scaffold)
- API: canEnqueue/onEnqueue/onStart/onDone/snapshot

Intégration future:
- brancher Tenant Queue / Command Bus
- exposer métriques (TITAN-4)
