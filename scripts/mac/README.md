# iCONTROL — Local Web Launcher (macOS)

## Objectif

Lancer **APP** et **Control Plane** en mode navigateur, **sans Terminal**, via un double-clic.

## Fichier

- `scripts/mac/icontrol-local-web.command`

## Usage

1. Assure-toi d’avoir **Node 20+**.
2. Double-clique `icontrol-local-web.command`.
3. Deux onglets s’ouvrent :
   - `/app/#/login`
   - `/cp/#/login`

## Logs

- Dans la fenêtre Terminal ouverte par le `.command`

## Script npm

- `npm run local:web`

## Port

Par défaut: `4176`  
Override:

- `ICONTROL_LOCAL_PORT=4176` (env)
