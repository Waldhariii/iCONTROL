# ADR-0001 — Monorepo modulaire multi-langage

## Contexte
Le système actuel contient du JS monolithique dans un HTML. On vise une séparation stricte par modules et par langage.

## Décision
Adopter un monorepo avec:
- core-kernel + platform-services stables
- modules autonomes (core vs complementary)
- contracts/ports pour éviter les dépendances transversales
- safe-render + audit-log pour robustesse

## Conséquences
- Plus de structure, plus de scaffolding, mais réduction massive du risque de panne globale.
