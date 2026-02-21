# iCONTROL — Architecture Freeze v1
TS: 2026-02-21T01:55:31Z
Status: OFFICIAL
Tag: ARCH_FREEZE_V1

------------------------------------------------------------
1. CANONICAL STRUCTURE (ROOT — single source of truth)
------------------------------------------------------------

/
├─ apps/
│  ├─ control-plane/     → CP (admin surface); _module_stubs_/, src/
│  ├─ client-app/        → Client runtime; src/
│  └─ portal/             → Marketing/landing; src/components/, src/pages/
├─ modules/
│  ├─ core-auth/, core-billing/, core-observability/, core-system/, sdk/
│  └─ core-system: shared/, subscription/, ui/frontend-ts/pages/
├─ platform/
│  ├─ api/src/           → middleware/, routes/{billing,cp,observability,tenants}
│  ├─ db/                 → migrations/, seeds/
│  └─ workers/src/        → jobs/, queues/
├─ runtime/
│  └─ configs/           → env/, ssot/
├─ scripts/              → audit/, ci/, dev/
├─ infra/                → docker/, helm/, k8s/, monitoring/{grafana,prometheus}, terraform/
├─ .github/              → ISSUE_TEMPLATE/, workflows/
└─ docs/                 → adr/, api/, architecture/, operating-model/, runbooks/, security/

_archive/ (hors prod — stockage froid):
- snapshots/, exports/, legacy/, unsorted/<TS>/, README.md
- legacy/ = anciennes structures migrées (governance, design-system, extensions, core) — read-only

_audit/ (hors prod — pipeline qualité):
- evidence/, work/, quarantine/, reports/, README.md
- work/ = 100% jetable ; idéalement gitignored

À la racine (hors bloc canonique):
- node_modules/           → outil (pnpm), gitignored

Structure canonique visible à la racine : apps, docs, infra, modules, platform, runtime, scripts, .github, _archive, _audit.

------------------------------------------------------------
2. CORE DEFINITION
------------------------------------------------------------

Core Canonical:
apps/control-plane/src/core

Shared Core:
modules/core-system

Root /core:
DEPRECATED (quarantined, non-importable)

------------------------------------------------------------
3. IMPORT GOVERNANCE (HARD RULES)
------------------------------------------------------------

L0  Core (pure domain)
L1  Shared Modules
L2  Platform adapters
L3  Surfaces (CP / APP)

Forbidden:
- Surfaces importing other surfaces
- Platform importing apps/*
- Any import from quarantined root core
- Cross-surface imports (cp → app, app → cp)

------------------------------------------------------------
4. ROUTING SSOT
------------------------------------------------------------

Single source of truth:
runtime/configs/ssot/ROUTE_CATALOG.json

All router logic must derive from SSOT.

No hardcoded route_id duplication allowed (future rule).

------------------------------------------------------------
5. TYPECHECK BOUNDARY
------------------------------------------------------------

apps/control-plane/tsconfig.typecheck.json is official boundary.
Modules are type-checked via generated stubs only.

Guard:
guard:module-stub-drift must PASS.

------------------------------------------------------------
6. CI GATES
------------------------------------------------------------

gates:cp must PASS:
- lint
- typecheck:cp
- guard:module-stub-drift

------------------------------------------------------------
7. STRUCTURAL CHANGE POLICY
------------------------------------------------------------

Any of the following requires ADR:
- New top-level directory
- New import alias
- New cross-boundary dependency
- Moving core logic
- Adding runtime root directory

------------------------------------------------------------
8. ARCHITECTURE STATUS
------------------------------------------------------------

Freeze State: STABLE
Version: v1
Next Phase: Performance & Observability Hardening
