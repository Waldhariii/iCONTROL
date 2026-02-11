# TITAN-2 — Capability-Based Security

Objectif: compléter RBAC par un modèle capability (least privilege).

Livrables:
- core-kernel/src/security/capabilities/{model.ts,policy.ts}
- requireCap() bloquant, codes d'erreur stables

Intégration future:
- mapping RBAC -> caps (control plane)
- tokens de capacité injectés dans SandboxContext (TITAN-1)
