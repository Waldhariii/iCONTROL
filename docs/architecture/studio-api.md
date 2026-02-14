# Studio API

All requests require header `x-role: cp.admin`.

## Changesets
- POST `/api/changesets`
- GET `/api/changesets/:id`
- POST `/api/changesets/:id/ops`
- POST `/api/changesets/:id/preview`
- POST `/api/changesets/:id/validate`
- POST `/api/changesets/:id/publish`

## Studio Objects
- POST `/api/studio/pages`
- PATCH `/api/studio/pages/:pageId`
- POST `/api/studio/routes`
- PATCH `/api/studio/routes/:routeId`
- DELETE `/api/studio/routes/:routeId`
- POST `/api/studio/nav`
- PATCH `/api/studio/nav/:navId`
- DELETE `/api/studio/nav/:navId`
- POST `/api/studio/widgets`
- DELETE `/api/studio/pages/:pageId`

## Runtime
- GET `/api/runtime/manifest?release=<id>`
- GET `/api/runtime/active-release`

## Releases
- GET `/api/releases`
- POST `/api/releases/:id/activate`
- POST `/api/releases/:id/rollback`

## Gates/Drift
- GET `/api/gates/:releaseId/report`
- GET `/api/drift/status`
- GET `/api/drift/report`
