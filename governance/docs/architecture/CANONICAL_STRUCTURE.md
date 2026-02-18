CANONICAL STRUCTURE — DO NOT DRIFT

Single-root: /Users/danygaudreault/iCONTROL

No parallel roots, no duplicate trees, no shadow "app2/", "main_system/", etc.

Enforce:
- app/ = UI surfaces only
- server/ = backend only
- core-kernel/ = sacred governance + contracts
- platform-services/ = replaceable infra services
- modules/ = isolated business domains
- shared/ = neutral helpers/types only
- runtime/configs/ = runtime config + tenant overrides (data only)
- scripts/ = gates + automation
- docs/ = SSOT docs
- _artifacts/ + _audit/ = generated-only
