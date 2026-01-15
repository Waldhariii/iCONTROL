# Acces local — iCONTROL (Client + Control Plane)

## Web (Dev)
- Client App: http://127.0.0.1:5176/app/#/login
- Control Plane: http://127.0.0.1:5177/cp/#/login

Commandes:
- Reset ports: `npm run dev:reset`
- Lancer APP: `npm run dev:app`
- Lancer CP: `npm run dev:cp`
- Lancer les deux: `npm run dev:both`

## Desktop (Tauri)
Prerequis: Rust + Tauri CLI installes.

Commandes:
- Desktop APP: `npm run desktop:app` (build)
- Desktop CP: `npm run desktop:cp` (build)
- Desktop dev APP: `npm run desktop:dev:app`
- Desktop dev CP: `npm run desktop:dev:cp`

Note: Desktop = acces local sans "site web", et sans exposition reseau.
