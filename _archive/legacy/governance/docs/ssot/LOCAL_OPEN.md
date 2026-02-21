# Local Web: Opening APP + CP URLs (SSOT Discovery)

## Commande Principale

```bash
bash scripts/open-local-ssot-urls.sh
```

## Fonctionnement

Le script `open-local-ssot-urls.sh` découvre automatiquement les routes depuis `ROUTE_CATALOG.json` via l'API HTTP, sans hardcoder de chemins.

### Étapes

1. **Détection du port**: Lit `/tmp/icontrol-local-web.port` (créé par `local-web.sh`)
2. **Vérification serveur**: Attend que le serveur soit prêt (max 10s)
3. **Découverte SSOT**: Récupère `ROUTE_CATALOG.json` via `GET /app/api/route-catalog`
4. **Extraction golden paths**:
   - **APP**: Préfère `home_app` → `dashboard` → première route ACTIVE
   - **CP**: Préfère `home_cp` → `dashboard_cp` → première route ACTIVE
5. **Ouverture**: Ouvre les URLs avec cache-buster (`?t=<timestamp>`)

### URLs Générées

- **APP**: `http://127.0.0.1:4176/app/#/home-app?t=<timestamp>`
- **CP**: `http://127.0.0.1:4176/cp/#/home-cp?t=<timestamp>`

## API Endpoints

Le serveur `runtime-config-server.js` expose:

- `GET /app/api/route-catalog` → `ROUTE_CATALOG.json` complet
- `GET /cp/api/route-catalog` → `ROUTE_CATALOG.json` complet (même source SSOT)

## Fallback

Si le catalog n'est pas accessible via API:
- **APP**: `#/home-app`
- **CP**: `#/home-cp`

## Intégration avec `local-web.sh`

Le script `local-web.sh` utilise automatiquement `open-local-ssot-urls.sh` pour ouvrir les URLs, remplaçant les routes hardcodées.

## Troubleshooting

### "Server not responding"
```bash
# Démarrer le serveur
npm run local:web
```

### "Route catalog not available"
- Vérifier que `runtime/configs/ssot/ROUTE_CATALOG.json` existe
- Vérifier que le serveur expose `/app/api/route-catalog`

### Cache/Service Worker
- Le script ajoute un cache-buster (`?t=<timestamp>`)
- Si problème persiste: vider le cache navigateur ou mode incognito

### Port personnalisé
```bash
ICONTROL_LOCAL_PORT=8080 npm run local:web
# Le script détectera automatiquement le port depuis /tmp/icontrol-local-web.port
```

## Contrat SSOT

- **Aucune route hardcodée**: Toutes les routes sont découvertes depuis `ROUTE_CATALOG.json`
- **Découverte dynamique**: Si une nouvelle route est ajoutée, le script la découvrira automatiquement
- **Pas de chemins absolus**: Utilise uniquement HTTP API et variables d'environnement
