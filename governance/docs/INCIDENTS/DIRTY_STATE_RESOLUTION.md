# DIRTY_STATE_RESOLUTION

## Cause(s) du dirty
- Large set de modifications (code + docs + config) sur la branche `theme-ssot-bootstrap-20260121_182814`.
- Suppressions de documents et fichiers `_REPORTS/**` visibles dans `git status`.
- Aucun artefact massif `dist/target/logs` n'apparaissait dans le status.

## Méthode de sauvegarde retenue
- Option A: `git stash push -u -m "WIP_snapshot_before_admin_ui_refactor"`
- Patch complet et inventaire générés avant stash.

## Commandes exécutées
```
# Diagnostique
 git status -sb
 git diff --stat
 git diff --name-status
 git log -n 20 --oneline

# Snapshot non destructif
 mkdir -p <repo-root>/_AUDIT_WIP
 git diff > <repo-root>/_AUDIT_WIP/dirty_state.patch
 git status --porcelain > <repo-root>/_AUDIT_WIP/dirty_state_status.txt
 git stash push -u -m "WIP_snapshot_before_admin_ui_refactor"

# Retour à un état propre
 git reset --hard
 git clean -fd

# Preuve
 git status -sb
```

## Où sont les sauvegardes
- Stash: `stash@{0}` (message: `WIP_snapshot_before_admin_ui_refactor`)
- Patch: `<repo-root>/_AUDIT_WIP/dirty_state.patch`
- Inventaire: `<repo-root>/_AUDIT_WIP/dirty_state_status.txt`

## Comment restaurer
- Stash: `git stash apply stash@{0}` (ou `git stash pop stash@{0}` si vous voulez retirer le stash)
- Patch: `git apply <repo-root>/_AUDIT_WIP/dirty_state.patch`

## Preuve finale (repo clean)
- `git status -sb` retourne uniquement `## theme-ssot-bootstrap-20260121_182814`
