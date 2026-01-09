# Pages shell — désactivées

Les pages Login/Dashboard sont désormais rendues par:
modules/core-system/ui/frontend-ts/pages/*

Le shell app/ garde uniquement:
- router + RBAC guard
- safe-render
- moduleLoader
- layout

Objectif: une seule source de vérité pour éviter collisions.
