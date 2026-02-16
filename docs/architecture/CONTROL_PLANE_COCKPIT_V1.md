# Control Plane Cockpit v1 (Phase AG)

Le Control Plane (CP) sur le port 5173 est un **cockpit d’exploitation** read-only : health, active release, index JSONL (gates, workflows, marketplace, billing, webhook, ops). Pas de “pages métier” client ; uniquement des vues de pilotage.

## Prérequis

- API : `pnpm api:dev` (ou `node apps/backend-api/server.mjs`) → http://127.0.0.1:7070
- CP : `pnpm cp:dev` (Vite) → http://127.0.0.1:5173

## Endpoints utilisés par le cockpit

Tous en **lecture seule**. Base URL configurable dans l’UI (défaut `http://127.0.0.1:7070`).

| Endpoint | Auth | Description |
|----------|------|-------------|
| GET /api/health | — | Health check (ok, at) |
| GET /api/runtime/active-release | — | Active release id + env |
| GET /api/reports/latest?kind=…&limit=N | Bearer (observability.read) | Dernières lignes d’un index JSONL |

**Valeurs de `kind` pour /api/reports/latest** : `gates`, `workflows`, `marketplace`, `billing`, `webhook`, `ops`.  
Fichiers servis (whitelist strict, pas de path traversal) :  
`runtime/reports/index/gates_latest.jsonl`, `workflows_latest.jsonl`, `marketplace_events.jsonl`, `billing_drafts.jsonl`, `webhook_verify.jsonl`, `ops_events.jsonl`.

## Vues cockpit

- **Health** : réponse brute de GET /api/health
- **Active Release** : GET /api/runtime/active-release
- **Gates / Workflows / Marketplace / Billing / Webhook / Ops** : dernières lignes des index JSONL via GET /api/reports/latest?kind=…

## Sécurité

- Aucune route serveur “business” ajoutée ; uniquement read-only.
- `/api/reports/latest` exige le scope `observability.read` (S2S ou token avec ce scope).
- Whitelist stricte des noms de fichiers (pas de `../`, pas de chemin arbitraire).
- Report Path Gate : pas d’écriture hors `runtime/reports/**`.

## Limites v1

- Pas de routing multi-pages ; une seule page Cockpit.
- Pas d’édition ; affichage et rafraîchissement uniquement.
- Deep links `studio://kind/id` prévus pour affichage futur (non implémentés en v1).

## CI

- `node scripts/ci/test-cp-cockpit-smoke.mjs` : démarre l’API en mode CI (port 0), vérifie GET /api/health, /api/runtime/active-release, /api/reports/latest?kind=workflows et kind=gates (avec token observability.read), et la présence des assets CP (index.html, cockpit.js).

## Fichiers

- `apps/control-plane/index.html` : page Cockpit (sections + input API Base URL)
- `apps/control-plane/cockpit.js` : chargement health, active release, index jsonl
- Backend : GET /api/health, GET /api/reports/latest (voir `apps/backend-api/server.mjs`)
