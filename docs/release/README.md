# Release — Canonical Entry Point

## Objective
Point d’entrée unique pour exécuter une release de façon outillée et audit-ready.

## Governance (DoD / Versioning / Checklist)
- docs/governance/releaseops/DoD.md
- docs/governance/releaseops/Versioning.md
- docs/governance/releaseops/Checklist.md

## Runbook (opérationnel)
- docs/runbooks/releaseops.md

## Tooling entrypoint
- Script: ./scripts/release/publish.zsh

## Standard flows

### Tooling prerelease (non-core)
- Dry-run:
  ./scripts/release/publish.zsh TAG=vX.Y.Z-toolsN --prerelease --retag --dry-run --scope "ReleaseOps Tooling"
- Real:
  ./scripts/release/publish.zsh TAG=vX.Y.Z-toolsN --prerelease --retag --scope "ReleaseOps Tooling"

### GA release (core)
- Dry-run:
  ./scripts/release/publish.zsh TAG=vX.Y.Z --ga --retag --dry-run --scope "ReleaseOps GA"
- Real:
  ./scripts/release/publish.zsh TAG=vX.Y.Z --ga --retag --scope "ReleaseOps GA"

### Hotfix (GA)
- Dry-run:
  ./scripts/release/publish.zsh TAG=vX.Y.Z-hotfixN --ga --retag --dry-run --scope "Hotfix"
- Real:
  ./scripts/release/publish.zsh TAG=vX.Y.Z-hotfixN --ga --retag --scope "Hotfix"

## Notes
- Toujours exécuter un dry-run avant un run réel.
- Le script impose: clean tree, tag==HEAD, et cohérence GitHub release (body "## Commit").

## Développement local — tests app (déterministe)
- Lancer les tests sans dépendre d’un pnpm global:
  - `././test_app.zsh`

## Provisioning manuel (Dev)
- Aller sur: `Developer -> Entitlements` (route: `/developer/entitlements`)
- Objectif: activer/désactiver des entitlements localement pour valider les guards UI et les parcours PRO.
