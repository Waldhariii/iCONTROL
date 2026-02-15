# Marketplace Studio

## Purpose
Provide a unified, manifest-driven Marketplace inside the Control Plane for installing and managing:
- Domain modules
- Extensions

All actions are changeset-only, gated, and audited. No fallback routes are allowed.

## Data Sources
- Modules: `platform/ssot/modules/*`
- Extensions: `platform/ssot/extensions/*`
- Marketplace catalog view: compiled into `platform_manifest.marketplace.catalog`

## Runtime Rules
- Active manifest is the sole source for catalog display.
- Install/enable/disable/uninstall are changeset-only.
- Impact analysis runs on preview manifests before apply.
- Quorum required for extension install and breaking module enable.

## Freeze Scopes
`change_freeze.scopes.content_mutations = true` stays enforced.
`change_freeze.scopes.studio_ui_mutations = false` allows Marketplace UI only.

