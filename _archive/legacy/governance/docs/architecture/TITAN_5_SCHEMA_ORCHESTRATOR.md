# TITAN-5 — Schema Evolution Engine

Objectif: migrations tenant-safe et rollbackables.

Livrables:
- core-kernel/src/schema/migrationOrchestrator.ts (scaffold)

Règles:
- append-only registry
- plan explicite (steps)
- tenantId obligatoire
