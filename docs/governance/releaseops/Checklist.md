# ReleaseOps — Checklist d’exécution (opérationnelle)

## Dry-run (obligatoire)
- `./scripts/release/publish.zsh TAG=... --prerelease|--ga --retag --dry-run --scope "..."`
- Résultat attendu: exit 0 + working tree clean après dry-run

## Run réel
- `./scripts/release/publish.zsh TAG=... --prerelease|--ga --retag --scope "..."`

## Post-check (must)
- `git rev-parse HEAD` == `git rev-parse "${TAG}^{}"`
- `gh release view "$TAG" --json name,tagName,isPrerelease,url`
- Parse `## Commit` dans le body et comparer au SHA7 du tag
- Working tree clean
