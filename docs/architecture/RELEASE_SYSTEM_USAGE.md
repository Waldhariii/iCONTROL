# Système Deploy ≠ Release - Guide d'utilisation

## Vue d'ensemble

Le système "Deploy ≠ Release" permet de :
- Déployer du code/config sans que les clients le voient
- Publier les changements de manière atomique
- Forcer la mise à jour des clients obsolètes (version gating)

## Architecture

### 1. Release Registry

Gère les versions publiées :
- `latest_version` : dernière version disponible
- `min_supported_version` : version minimale supportée
- `published_config_version` : version de config publiée
- `draft_config_version` : version de config en draft (admin only)

**Fichier** : `app/src/core/release/registry.ts`

### 2. Config Registry

Gère les configurations DRAFT → PREVIEW → PUBLISH :
- **DRAFT** : modifications invisibles (admin only)
- **PREVIEW** : validation QA + simulation RBAC/SAFE_MODE
- **PUBLISHED** : version figée (clients)

**Fichier** : `app/src/core/release/configRegistry.ts`

### 3. Config Editor

Éditeur de configurations :
- `loadDraft()` : charge la config DRAFT
- `saveDraft()` : sauvegarde en DRAFT
- `previewDraft()` : copie DRAFT → PREVIEW
- `publishDraft()` : publication atomique (snapshot DRAFT → PUBLISHED)

**Fichier** : `app/src/core/release/configEditor.ts`

### 4. Version Gating

Force update des clients obsolètes :
- Vérification au boot
- Vérification périodique (à implémenter)
- Modal de blocage obligatoire
- Force reload avec cache busting

**Fichier** : `app/src/core/release/versionGate.ts`

### 5. Endpoint `/meta/release`

Endpoint serveur pour version gating :
- `GET /meta/release`
- Header : `X-Client-Version: 1.4.2`
- Retourne `426 Upgrade Required` si version < minSupported

**Fichier** : `server/runtime-config-server.js`

## Utilisation

### Pour les Admins (Control Plane)

#### 1. Modifier une configuration en DRAFT

```typescript
import { configEditor } from "/src/core/release";

// Charger la config DRAFT
const draft = await configEditor.loadDraft();

// Modifier la config
const updated = {
  ...draft,
  pages: [
    ...draft.pages,
    { id: "new-page", title: "Nouvelle Page", path: "/new", visible: true, roles: ["ADMIN"], order: 10 }
  ]
};

// Sauvegarder en DRAFT
await configEditor.saveDraft(updated);
```

#### 2. Preview (validation QA)

```typescript
// Copier DRAFT → PREVIEW
await configEditor.previewDraft();

// Charger la config PREVIEW pour validation
const preview = configEditor.getPreviewConfig();
```

#### 3. Publication atomique

```typescript
// Publier DRAFT → PUBLISHED
await configEditor.publishDraft({
  bumpLatestVersion: true, // Optionnel : incrémenter latest_version
  setMinSupportedVersion: "0.3.0" // Optionnel : forcer update si breaking change
});
```

### Pour les Clients

Les clients chargent automatiquement la config PUBLISHED :

```typescript
import { loadPublishedConfig } from "/src/core/release";

const config = loadPublishedConfig();
// Utiliser config.pages, config.tables, etc.
```

### Version Gating

Le version gating est automatique au boot de l'application :

1. L'application appelle `checkVersionGateAPI()` au démarrage
2. Si `clientVersion < minSupportedVersion` :
   - Modal de blocage affiché
   - Bouton "Mettre à jour" force reload avec cache busting
3. L'application ne démarre pas tant que la mise à jour n'est pas effectuée

## Configuration

### Variables d'environnement (serveur)

```bash
ICONTROL_LATEST_VERSION=0.2.0
ICONTROL_MIN_SUPPORTED_VERSION=0.2.0
```

### LocalStorage

Les configurations sont stockées dans localStorage :
- `icontrol_release_registry` : Release Registry
- `icontrol_config_registry` : Config Registry (draft, preview, published)

**Note** : En production, ces données devraient être stockées dans une base de données.

## Routes

Le système utilise les routes suivantes :
- `/app` → App Client (runtime)
- `/cp` → Control Plane (admin)
- `/toolbox` → Toolbox (admin, UI editor) - À implémenter
- `/api` → API Backend
- `/meta/release` → Version gating endpoint

## Prochaines étapes

1. ✅ Release Registry créé
2. ✅ Config Registry créé
3. ✅ Config Editor créé
4. ✅ Version Gating implémenté
5. ✅ Endpoint `/meta/release` créé
6. ⏳ Adapter la Toolbox pour éditer en DRAFT
7. ⏳ Implémenter la publication atomique complète
8. ⏳ Intégrer avec le système d'audit existant

## Notes

- Le système utilise localStorage pour le développement
- En production, migrer vers une base de données
- L'endpoint `/meta/release` devrait être sécurisé (authentification admin)
- Le version gating peut être désactivé en développement
