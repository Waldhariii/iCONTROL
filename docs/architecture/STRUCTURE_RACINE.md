# Structure à la racine du dépôt

## Dossier .github (présent mais masqué)

Le dossier **`.github`** est bien à la racine. Son nom commence par un point (`.`), donc :

- Sous **macOS / Finder** : afficher les fichiers cachés avec **Cmd + Shift + .**
- Sous **VS Code / Cursor** : le dossier apparaît dans l’explorateur ; s’il est filtré, vérifier les paramètres « Files: Exclude » et ne pas exclure `.github`.

Contenu attendu : `ISSUE_TEMPLATE/`, `workflows/` (CI), `README.md`.

## node_modules (à la racine)

**`node_modules`** est créé par pnpm à la racine et **ne doit pas être supprimé** : c’est requis pour les commandes `pnpm install`, `pnpm run build`, etc.

- Il est **ignoré par Git** (dans `.gitignore`), donc non versionné.
- Pour le **masquer dans l’IDE** : ajouter `node_modules` dans les exclusions (ex. Cursor/VS Code : `files.exclude` → `**/node_modules`).

Structure canonique visible à la racine (hors fichiers cachés et ignorés) : **apps**, **_archive**, **docs**, **infra**, **modules**, **platform**, **runtime**, **scripts**, plus les fichiers de config.
