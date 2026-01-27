# Test Matrix: APP vs CONTROL_PLANE

## Architecture

Les tests sont exécutés en **matrice** pour garantir que les deux surfaces (APP et CONTROL_PLANE) fonctionnent correctement.

### Runners Dédiés

- **`test:app`**: Exécute les tests avec `VITE_APP_KIND=APP`
  - Script: `scripts/vitest-app.sh`
  - Cible: Surface APP (Client Application)

- **`test:cp`**: Exécute les tests avec `VITE_APP_KIND=CONTROL_PLANE`
  - Script: `scripts/vitest-cp.sh`
  - Cible: Surface CONTROL_PLANE (Control Plane)

- **`test:matrix`**: Exécute les deux runners séquentiellement
  - Commande: `npm run test:app && npm run test:cp`
  - Utilisé en CI pour validation complète

### Scripts

#### `scripts/vitest-app.sh`
```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../app"
export VITE_APP_KIND=APP
npx vitest run
```

#### `scripts/vitest-cp.sh`
```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../app"
export VITE_APP_KIND=CONTROL_PLANE
npx vitest run
```

## Utilisation

### Local Development

```bash
# Tester APP uniquement
npm run test:app

# Tester CONTROL_PLANE uniquement
npm run test:cp

# Tester les deux (matrice complète)
npm run test:matrix
```

### CI/CD

Le workflow `.github/workflows/ci-test.yml` exécute automatiquement `npm run test:matrix` pour valider les deux surfaces.

## Contrat SSOT

- **Chaque runner force explicitement `VITE_APP_KIND`** avant d'exécuter vitest
- **Aucun runner ne dépend de `VITE_APP_KIND` défini dans l'environnement**
- **La matrice garantit que les deux surfaces sont testées**

## Cohérence avec Autres Scripts

Cette architecture est cohérente avec:
- `dev:app` / `dev:cp` (développement)
- `build:app` / `build:cp` (build)

Tous utilisent `VITE_APP_KIND` pour séparer explicitement APP et CONTROL_PLANE.
