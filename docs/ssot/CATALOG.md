# SSOT CATALOG (Canonical)

## Purpose
Single source of truth for:
- surfaces (APP/CP)
- routes (stable IDs)
- module-to-page mapping
- storage namespaces
- entitlements / feature flags
- extension capability map

## Non-negotiables
- No duplicate route IDs
- No parallel path roots outside /Users/danygaudreault/iCONTROLapp
- Modules cannot import from app/src or server/src
- Storage keys must be namespaced and declared here
