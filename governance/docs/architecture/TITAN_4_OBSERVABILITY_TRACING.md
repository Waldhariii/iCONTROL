# TITAN-4 — Distributed Observability

Objectif: traceId/correlationId/tenantId partout, pas seulement des logs.

Livrables:
- platform-services/observability/tracing/{trace.ts,emit.ts}
- mkTraceContext() stable
- emitTrace() stub (future: metrics + exporter)
