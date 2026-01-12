# Runbook — ReleaseOps

## Contexte
Ce runbook décrit l’exécution opérationnelle d’une release outillée via `publish.zsh`.

## Pré-requis
- Branche propre (`main`)
- Working tree clean
- Authentification GitHub CLI active
- Tests locaux fonctionnels

## Dry-Run (obligatoire)
```bash
./scripts/release/publish.zsh TAG=vX.Y.Z-toolsN --prerelease --retag --dry-run --scope "ReleaseOps Tooling"
```

## Release outillée (prerelease)
```bash
./scripts/release/publish.zsh TAG=vX.Y.Z-toolsN --prerelease --retag --scope "ReleaseOps Tooling"
```

## GA release (différences vs prerelease)
- Utiliser `--ga` au lieu de `--prerelease`
- Tag final (ex. `vX.Y.Z`)
```bash
./scripts/release/publish.zsh TAG=vX.Y.Z --ga --retag --scope "ReleaseOps GA"
```

## Rollback (tag + release GitHub)
```bash
TAG=vX.Y.Z

gh release delete "$TAG" --yes

git tag -d "$TAG"
git push origin ":refs/tags/${TAG}"
```

## Hotfix outillé
```bash
# Préparer le correctif, fusionner sur main, puis publier un nouveau tag
./scripts/release/publish.zsh TAG=vX.Y.Z-hotfixN --ga --retag --scope "Hotfix"
```

## Post-release verification checklist
- `git rev-parse ${TAG}^{}` == `git rev-parse HEAD`
- Release GitHub: `tag_name == ${TAG}` et `name == ${TAG}`
- Release Notes: section `## Commit` présente
- Release Notes: SHA7 == SHA7 du tag
- `close-the-loop` = PASS
- Build et audits = GREEN
