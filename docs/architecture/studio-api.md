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
- POST `/api/studio/nav`
- POST `/api/studio/widgets`
- DELETE `/api/studio/pages/:pageId`

## Runtime
- GET `/api/runtime/manifest/:releaseId`
