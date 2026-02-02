# TITAN-1 — Extension Sandbox

Objectif: fournir une frontière d'exécution stable pour extensions/plugins.

Livrables:
- core-kernel/src/extensions/sandbox/{types.ts,sandbox.ts}
- Contrats: tenantId + correlationId obligatoires
- Timeouts et fondations pour quotas/caps/circuit-breaker

Roadmap:
- capability firewall (TITAN-2)
- quotas (maxConcurrent/maxQueueDepth) + métriques
- kill-switch par tenant/extension
