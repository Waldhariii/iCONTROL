# ADR-0002 — Core-Kernel Purity (Contracts Only)

## Contexte
Le noyau devait rester minimal, durable et sans dependances d'implementation.
couplait le core-kernel a l'environnement UI.

## Decision
et laisser le core-kernel avec des contrats/types uniquement.

## Consequences
- core-kernel reste sans DOM/localStorage/import.meta.
- platform-services contient les implementations runtime.
- les modules et l'app consomment les implementations via platform-services.
