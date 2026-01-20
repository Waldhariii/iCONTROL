# Architecture Enterprise-Grade : Deploy ≠ Release

## Objectif
Mettre en place un modèle "Deploy ≠ Release" : on peut déployer du code/config sans que les clients le voient, puis publier quand prêt.

## État Actuel (Analyse)

### ✅ Ce qui existe déjà

1. **Version Policy** (`app/src/policies/version_policy.*`)
   - Gère SOFT_BLOCK, HARD_BLOCK, MAINTENANCE
   - `min_version`, `latest_version`
   - Intégré au boot process

2. **Feature Flags** (`app/src/policies/feature_flags.*`)
   - États : ON, OFF, ROLLOUT, FORCE_OFF
   - Rollout par tenant (bucket-based)
   - Intégré au Control Plane

3. **Routes séparées** (`server/runtime-config-server.js`)
   - `/app` → Application Client
   - `/cp` → Control Plane (admin)
   - Gestion des assets avec MIME types corrects

4. **ReleaseOps** (`docs/release/`, `scripts/release/`)
   - Scripts de publication
   - DoD (Definition of Done)
   - Versioning standardisé

### ❌ Ce qui manque

1. **Système DRAFT → PREVIEW → PUBLISH**
   - Pas de canal de configuration séparé
   - Pas de snapshot immuable des configs publiées

2. **Release Registry (backend)**
   - Pas d'endpoint `/meta/release`
   - Pas de gestion centralisée des versions publiées

3. **Config-driven UI avec versioning**
   - Toolbox édite directement (pas de draft)
   - Pas de séparation draft/published

4. **Version Gating côté client**
   - Pas de modal de blocage obligatoire
   - Pas de vérification périodique de version

5. **Publication atomique**
   - Pas de mécanisme de snapshot + bump version

---

## Architecture Cible

### 1. Modèle de Configuration (DRAFT → PREVIEW → PUBLISH)

```typescript
// app/src/core/release/configRegistry.ts

export type ConfigChannel = "draft" | "preview" | "published";

export interface ConfigVersion {
  version: string; // "1.5.0"
  channel: ConfigChannel;
  createdAt: string; // ISO date
  publishedAt?: string; // ISO date (si channel === "published")
  snapshot: ConfigSnapshot; // Immutable une fois publié
}

export interface ConfigSnapshot {
  pages: PageConfig[];
  tables: TableConfig[];
  tabs: TabConfig[];
  featureFlags: FeatureFlagConfig[];
  uiTokens: UITokenConfig[];
  // ... autres configs
}

export interface ReleaseRegistry {
  latest_version: string;
  min_supported_version: string;
  published_config_version: string; // Version de config publiée
  draft_config_version: string; // Version de config en draft (admin only)
  channels: {
    draft: ConfigVersion | null;
    preview: ConfigVersion | null;
    published: ConfigVersion | null;
  };
}
```

### 2. Endpoint `/meta/release` (Version Gating)

```typescript
// server/api/meta/release.ts

GET /meta/release
Headers: X-Client-Version: 1.4.2

Response:
{
  "latest": "1.5.0",
  "minSupported": "1.5.0",
  "message": "Une nouvelle version est disponible. Veuillez mettre à jour.",
  "url": "https://mon-domaine.com/app",
  "publishedConfigVersion": "1.5.0",
  "requiresUpdate": true
}

Status Codes:
- 200: OK, version compatible
- 426: Upgrade Required (clientVersion < minSupported)
```

### 3. Routes Séparées (Même Port)

```
https://mon-domaine.com/app        → App Client (runtime)
https://mon-domaine.com/cp         → Control Plane (admin)
https://mon-domaine.com/toolbox    → Toolbox (admin, UI editor)
https://mon-domaine.com/api        → API Backend
```

**Configuration NGINX (concept)** :
```nginx
location /app/ {
    try_files $uri $uri/ /app/index.html;
    # Assets versionnés avec cache busting
}

location /cp/ {
    try_files $uri $uri/ /cp/index.html;
}

location /toolbox/ {
    try_files $uri $uri/ /toolbox/index.html;
}

location /api/ {
    proxy_pass http://backend:3000;
}

location /meta/ {
    proxy_pass http://backend:3000;
}
```

### 4. Toolbox : Édition en DRAFT

**Workflow** :
1. Admin ouvre Toolbox → charge config DRAFT
2. Admin modifie pages/tables/onglets → sauvegarde en DRAFT
3. Admin peut "Preview" → charge config PREVIEW (validation QA)
4. Admin "Publish" → snapshot DRAFT → devient PUBLISHED (atomique)

**Code** :
```typescript
// app/src/core/release/configEditor.ts

export class ConfigEditor {
  async loadDraft(): Promise<ConfigVersion> {
    // Charge depuis backend ou localStorage (admin only)
  }
  
  async saveDraft(config: ConfigSnapshot): Promise<void> {
    // Sauvegarde en DRAFT (invisible aux clients)
  }
  
  async previewDraft(): Promise<void> {
    // Copie DRAFT → PREVIEW (pour validation QA)
  }
  
  async publishDraft(): Promise<void> {
    // 1) Snapshot DRAFT → PUBLISHED (immutable)
    // 2) Bump published_config_version
    // 3) Optionnel: bump latest_version
    // 4) Audit event
  }
}
```

### 5. Client : Lecture PUBLISHED uniquement

```typescript
// app/src/core/release/configLoader.ts

export async function loadPublishedConfig(): Promise<ConfigSnapshot> {
  // Charge uniquement la config PUBLISHED
  // Ignore DRAFT et PREVIEW
  const response = await fetch('/api/config/published');
  return response.json();
}
```

### 6. Version Gating (Force Update)

```typescript
// app/src/core/release/versionGate.ts

export async function checkVersionGate(): Promise<VersionGateResult> {
  const clientVersion = getClientVersion(); // Depuis package.json ou build
  const response = await fetch('/meta/release', {
    headers: { 'X-Client-Version': clientVersion }
  });
  
  if (response.status === 426) {
    // Upgrade Required
    return {
      requiresUpdate: true,
      message: (await response.json()).message,
      url: (await response.json()).url
    };
  }
  
  return { requiresUpdate: false };
}

// Dans main.ts (boot)
const gate = await checkVersionGate();
if (gate.requiresUpdate) {
  showUpdateModal(gate.message, gate.url);
  // Bloque l'utilisation jusqu'à mise à jour
}
```

---

## Plan d'Implémentation

### Phase 1 : Infrastructure de Base

1. **Créer le Release Registry** (`app/src/core/release/registry.ts`)
   - Structure de données
   - Persistence (localStorage pour dev, backend pour prod)

2. **Créer l'endpoint `/meta/release`** (`server/api/meta/release.js`)
   - Lecture du Release Registry
   - Validation de version client
   - Retour 426 si upgrade requis

3. **Adapter le serveur** (`server/runtime-config-server.js`)
   - Ajouter route `/meta/release`
   - Gérer header `X-Client-Version`

### Phase 2 : Système DRAFT/PREVIEW/PUBLISH

4. **Créer ConfigRegistry** (`app/src/core/release/configRegistry.ts`)
   - Gestion des canaux (draft, preview, published)
   - Snapshot immuable

5. **Créer ConfigEditor** (`app/src/core/release/configEditor.ts`)
   - Édition en DRAFT
   - Preview (copie DRAFT → PREVIEW)
   - Publication atomique (snapshot + bump)

6. **Adapter la Toolbox** (`app/src/core/editor/toolboxWindow.ts`)
   - Charger config DRAFT
   - Sauvegarder modifications en DRAFT
   - Boutons "Preview" et "Publish"

### Phase 3 : Version Gating Côté Client

7. **Créer versionGate** (`app/src/core/release/versionGate.ts`)
   - Vérification au boot
   - Vérification périodique (polling)

8. **Créer UpdateModal** (`app/src/core/ui/updateModal.ts`)
   - Modal de blocage obligatoire
   - Bouton "Mettre à jour" (force reload + cache bust)

9. **Intégrer dans main.ts**
   - Appel `checkVersionGate()` au boot
   - Blocage si upgrade requis

### Phase 4 : API Backend (Optionnel - pour production)

10. **Backend API** (`server/api/config/`)
    - `GET /api/config/published` → config PUBLISHED
    - `GET /api/config/draft` → config DRAFT (admin only)
    - `POST /api/config/draft` → sauvegarder DRAFT (admin only)
    - `POST /api/config/publish` → publier DRAFT (admin only)

---

## Patterns Recommandés

### Pattern A : Config-driven UI (Scalable)

- Pages/tables/onglets décrits en JSON (contracts)
- Toolbox édite ces JSON en DRAFT
- Preview rend la config DRAFT
- Publish fige la config en PUBLISHED versionnée

**Avantages** :
- Très scalable
- Pas besoin de redéployer le code pour changer l'UI
- Historique complet des changements

### Pattern B : Feature Flags + Code (Hybride)

- Code des nouvelles pages déjà déployé en prod
- Masqué derrière flags
- Toolbox pilote les flags par environnement/tenant/rôle
- Publish = active le flag pour les clients

**Avantages** :
- Flexibilité pour features lourdes
- Rollback instantané (kill switch)

### Best Practice : Combiner A + B

- **A** pour layout/visuel/ordering/tables/columns/actions
- **B** pour features lourdes ou expérimentales

---

## Sécurité

### Isolation Admin/Client

1. **Sous-domaines séparés** (idéal) :
   - `app.mon-domaine.com` → Client
   - `admin.mon-domaine.com` → Control Plane
   - Réduit le risque XSS entre apps

2. **Même port par chemins** (si nécessaire) :
   - Routes strictes (`/app`, `/cp`, `/toolbox`)
   - Reverse proxy (NGINX) pour isolation

### Garde-fous

1. **API Gate** : Header `X-Client-Version` vérifié côté serveur
2. **RBAC** : Seuls les admins peuvent accéder à `/api/config/draft`
3. **Audit** : Toutes les publications sont auditées

---

## Résultat Attendu

✅ Admin modifie tout via Toolbox (draft) sans visibilité client  
✅ Validation se fait en preview/staging  
✅ Publication est une bascule atomique vers une version published  
✅ Clients ne voient les changements qu'au publish  
✅ Clients sont forcés à "update" si version < minSupported  
✅ Rollback instantané possible (revenir à version précédente)  

---

## Notes de Positionnement

### Option Premium
- **LaunchDarkly** : Feature flags + progressive delivery + gouvernance
- GitOps/CI/CD intégré
- Version gating automatique

### Option Open-Source
- **Unleash OSS** : Feature flags, environnements, stratégies, rollbacks
- Config-driven UI custom
- Version gating custom

### Option Hybride (Recommandé pour iCONTROL)
- Feature flags existants (déjà en place)
- Config-driven UI custom (nouveau)
- Version gating custom (nouveau)
- Évolutif vers LaunchDarkly/Unleash si besoin
