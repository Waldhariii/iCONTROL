# Core Freeze Policy (Phase W)

## Core Definition
Core includes platform runtime, compilers, backend/control-plane apps, governance, and any shared kernel/contracts:
- `apps/`
- `core/`
- `platform/` (except SSOT domain modules)
- `governance/`
- `scripts/` (except maintenance/CI allowlist)

## Hard Boundary
No new features in core. Only the following are allowed:
- Security fixes
- Bug fixes
- Performance and stability fixes
- Gates and tests
- Documentation

All new business value must ship as **domain modules** (SSOT in `platform/ssot/modules/*`).

## Allowed Change Areas (Gate Allowlist)
- `docs/`
- `governance/gates/`
- `scripts/maintenance/`
- `scripts/ci/`
- `platform/ssot/modules/`
- Studio module authoring paths:
  - `apps/backend-api/server.mjs`
  - `apps/control-plane/public/app.js`
  - `platform/ssot/studio/routes/route_specs.json`
  - `platform/ssot/studio/nav/nav_specs.json`
  - `platform/ssot/studio/pages/page_definitions.json`

Changes outside these areas in core paths will fail **Core Change Gate**.
