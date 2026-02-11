# ReleaseOps — Definition of Done (DoD)

## Scope
Ce DoD s’applique à toute publication via `./scripts/release/publish.zsh`.

## DoD-1 — Versioning (naming)
- Tooling prerelease: `vX.Y.Z-toolsN` (ex: `v0.2.0-tools9`)
- GA: `vX.Y.Z` (ex: `v0.2.0`)
- Hotfix GA: `vX.Y.Z-hotfixN` (ex: `v0.2.0-hotfix1`)

## DoD-2 — Invariants Git
- Working tree clean avant exécution.
- Tag annoté obligatoire.
- Tag doit pointer sur HEAD à la fin (après commit des notes).

## DoD-3 — Invariants GitHub Release
- `name == tag_name == TAG`
- Le body contient une section `## Commit`
- Le SHA7 sous `## Commit` == SHA7 du tag (`git rev-parse "${TAG}^{}" | cut -c1-7`)

## DoD-4 — Gates techniques
- `close-the-loop` PASS
- Tests GREEN
- Audits GREEN
- Build GREEN
- Dist leak check PASS

## DoD-5 — macOS safety (ACL/flags)
- `preflight_git_writable` doit PASS avant toute action d’écriture.
