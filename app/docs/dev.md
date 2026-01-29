# iCONTROL (APP + CONTROL_PLANE) — Dev Runbook (SSOT)

Référence: 2026-01-29 (America/Montreal)  
Workspace: /Users/danygaudreault/System_Innovex_CLEAN/iCONTROL/app

## Objectif
Standardiser l’exécution locale et garantir la conformité SSOT (gouvernance + contrats Vitest) avec une commande unique de vérification et deux commandes de démarrage (APP / CP).

---

## 1) Gate unique (SSOT)

Commande canonique (à exécuter avant toute PR / merge / release):
    npm run verify:ssot

Variante rapide (scans seulement):
    npm run verify:ssot:fast

Evidence pack (logs):
- app/_audit/VERIFY_SSOT_FAST_*.log
- app/_audit/VERIFY_SSOT_FULL_*.log

---

## 2) Démarrage DEV (ports dynamiques)

On ne dépend pas d’un port fixe. Toujours lire la ligne "Local:" affichée par Vite.

APP (client app):
    npm run dev:app

URL attendue (PORT = celui affiché par Vite):
    http://localhost:PORT/app/#/dashboard

CONTROL_PLANE (CP / admin):
    npm run dev:cp

URL attendue (PORT = celui affiché par Vite):
    http://localhost:PORT/cp/#/dashboard

---

## 3) Gouvernance (rappels non négociables)
- Aucun window.navigate(...)
- Aucun write direct location.hash = ... dans les modules critiques
  (write gateway autorisé: src/runtime/navigate.ts)
- Mount SSOT: un seul write direct vers __ICONTROL_MOUNT__ (via src/main.ts)
- Router mount-first: mount global -> #cxMain -> #app -> document.body
- Aucun import-time side effect (navigation/écriture hash à l’import interdit)

---

## 4) Diagnostic (DEV only)
Si disponible en console navigateur:
    __ICONTROL_DIAGNOSTIC__()

---

## 5) Notes Ops (ports / zombies)
Si plusieurs serveurs Vite sont actifs (ports 5173+), fermer proprement les sessions (Ctrl+C) avant de relancer.

---

## 6) Hook git pre-push (local)
Un hook local est installé dans le repo (`.git/hooks/pre-push`) pour exécuter automatiquement:
    npm run preflight

Objectif: bloquer les pushes si la gouvernance SSOT casse (scans rapides).

Bypass exceptionnel (non recommandé):
    git push --no-verify
