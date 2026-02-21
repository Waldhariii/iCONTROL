# Instructions d'installation — iCONTROL

**Date :** 2026-01-20

---

## Installation des dépendances

```bash
cd iCONTROL
npm install
```

### Dépendances principales

- **DOMPurify** (`dompurify@^3.0.6`) : sanitization HTML
- **ESLint** (`@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`) : linting strict

---

## Vérifications post-installation

```bash
cd iCONTROL
npm list dompurify @typescript-eslint/eslint-plugin @typescript-eslint/parser
cd app && npm run typecheck
cd .. && npm run lint
```

---

## Build et serveur

```bash
npm run build:ssot          # Build APP + CP
npm run server:build         # Build serveur SSOT
npm run server:prod         # Démarrer le serveur (port 4176)
```

---

## Accès

- **APP (client)** : http://127.0.0.1:4176/app/#/home-app
- **CP (administration)** : http://127.0.0.1:4176/cp/#/login

---

*Voir aussi governance/docs/STANDARDS/CONTRIBUTING.md et governance/docs/GO_LIVE_CHECKLIST.md.*
