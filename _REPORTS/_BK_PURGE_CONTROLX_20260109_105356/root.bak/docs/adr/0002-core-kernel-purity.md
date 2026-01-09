# ADR-0002 — Core-Kernel Purity (Contracts Only)

## Contexte
Le noyau devait rester minimal, durable et sans dependances d'implementation.
Des services (branding/auth local) utilisaient localStorage et import.meta, ce qui
couplait le core-kernel a l'environnement UI.

## Decision
Deplacer les implementations UI (branding et auth local) vers platform-services,
et laisser le core-kernel avec des contrats/types uniquement.

## Consequences
- core-kernel reste sans DOM/localStorage/import.meta.
- platform-services contient les implementations runtime.
- les modules et l'app consomment les implementations via platform-services.
