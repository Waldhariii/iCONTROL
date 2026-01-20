# 📐 SPÉCIFICATION COMPLÈTE - INTERFACE iCONTROL
## Analyse Image + Instructions + Recommandations Détaillées

---

## 🎨 VUE D'ENSEMBLE — LOGIQUE GLOBALE

**Application**: iCONTROL – Control Plane (CP)  
**Type**: Console d'administration / toolbox externe  
**Style**:
- Dark enterprise (fond `#0f1112`, panneaux `#1a1d1f`)
- Cartes modulaires (bordures `#2b3136`, border-radius 8px)
- Espacements généreux (16px gaps, padding confortable)
- Hiérarchie visuelle très lisible (tailles de police variées, poids typographiques)

**Principes UX**:
- ✅ Rien de vide — toujours du contenu utile
- ✅ États utiles — data, placeholder intelligent, aide contextuelle
- ✅ Lecture rapide → action immédiate

**Palette Couleurs**:
- Fond: `#0f1112` (noir très foncé)
- Panneaux: `#1a1d1f` (gris très foncé)
- Bordures: `#2b3136` (gris moyen)
- Texte: `#e7ecef` (gris très clair)
- Accent bleu: `#3b82f6`
- Accent violet: `#7b2cff`
- Succès vert: `#34d399`
- Avertissement orange: `#f59e0b`
- Erreur rouge: `#ef4444`

---

## 📄 PAGE 1: DASHBOARD (Vue Exécutive)

### Objectif
Donner une vision instantanée de la santé du système.

### Structure Visuelle

**Header (fixe, largeur 100%)**:
- Hamburger menu ☰ (gauche)
- Titre "Dashboard" (15px, weight 600)
- Badge état global à droite: "OPÉRATIONNEL" (vert) / "DÉGRADÉ" (orange) / "INCIDENT" (rouge)
- Indicateur système avec point clignotant + "iCONTROL"

**Layout Principal**:
- **Grille 2×2 de cartes KPI** (gap 16px, padding 16px)
- **Bande inférieure**: "Événements récents" (optionnel)

### CARTE 1: Santé Système

**Contenu**:
- **Métriques** (3 colonnes):
  - CPU: "12%" avec barre de progression circulaire ou linéaire (vert si <50%, orange 50-80%, rouge >80%)
  - Mémoire: "68%" avec barre de progression (même code couleur)
  - Temps réponse: "10ms" (vert si <100ms, orange <500ms, rouge >500ms)
- **Graphique ligne** montrant évolution CPU/Mémoire sur 24h
- **Tooltip** au survol expliquant chaque métrique

**Améliorations**:
- ✅ Clic sur métrique = navigation vers page Système
- ✅ Skeleton loader pendant chargement données
- ✅ Badge "Tendance" (↗ amélioration, ↘ dégradation)

### CARTE 2: Activité

**Contenu**:
- **"Activité"**: "195.4 k" (grand nombre, vert `#34d399`) avec barre graphique verte
- **"Retours API"**: "17.8 K" (bleu `#3b82f6`) avec barre bleue
- **"Latence"**: "1.2k" (violet `#7b2cff`) avec barre violette
- **Graphique ligne** en dessous montrant activité sur 24h (7h00 → 7h00)
- Légende: "CNC DORS", "Lime 3156tes"

**Améliorations**:
- ✅ Tooltip: période exacte (24h, 7j, 30j)
- ✅ Clic = zoom période
- ✅ Filtre période rapide (1h, 24h, 7j, 30j)

### CARTE 3: Erreurs

**Contenu**:
- **Compteurs**:
  - WARN: nombre (orange `#f59e0b`)
  - ERR: nombre (rouge `#ef4444`)
- **Graphique barres**: distribution WARN/ERR
- **Bouton**: "Voir logs" (lien vers page Logs)
- **Liste** erreurs récentes (5 dernières)

**Améliorations**:
- ✅ Badge "Critique" si ERR > 10
- ✅ Clic = filtre logs automatique
- ✅ Explication courte de chaque erreur fréquente

### CARTE 4: Modules

**Contenu**:
- **État modules**:
  - Actifs: nombre (vert)
  - Inactifs: nombre (gris)
- **SAFE_MODE impact**: badge affichant niveau et modules affectés
- **Liste modules** avec statut (coche verte = actif, X rouge = inactif)

**Améliorations**:
- ✅ Clic = voir détails module
- ✅ Avertissement si module critique inactif
- ✅ Health score global système

---

## 📄 PAGE 2: UTILISATEURS

### Objectif
Gestion RBAC claire et sécurisée.

### Structure

**Header**:
- Titre: "Utilisateurs"
- Sous-titre: Rôle courant + application cible (ex: "Rôle: ADMIN | Application: CP")
- **Bouton primaire**: "+ Ajouter un utilisateur" (bleu dégradé, coin supérieur droit)

**Barre d'outils** (sous header):
- Recherche instantanée (input avec icône 🔍)
- Filtres: Rôle (dropdown), Statut (dropdown), Application (dropdown)
- Bouton export CSV/JSON

**Tableau Principal** (pleine largeur):

**Colonnes**:
1. **Nom** (2fr - large)
   - Avatar circulaire (40px) avec initiales ou photo
   - Nom complet en gras
   - Email en petit texte gris
2. **Rôle** (1fr)
   - Badge couleur selon rôle:
     * SYSADMIN: violet `#7b2cff`
     * ADMIN: bleu `#3b82f6`
     * DEVELOPER: vert `#34d399`
     * USER: gris `#a7b0b7`
3. **Application** (1fr)
   - Badge "CP" ou "APP"
   - Icône application
4. **Pages accessibles** (1.5fr)
   - Liste condensée: "Dashboard, Système, Logs, ..."
   - Tooltip au survol = liste complète avec checkmarks
   - Badge "+5" si plus de 3 pages
5. **Dernière activité** (1fr)
   - Timestamp relatif: "Il y a 2h"
   - Icône horloge 🕐
   - Tooltip = date/heure exacte
6. **Actions** (80px)
   - Menu dropdown avec icônes:
     * ✏️ Modifier
     * 🔑 Réinitialiser mot de passe
     * ⏸️ Désactiver / ▶️ Activer
     * 🗑️ Supprimer (rouge, avec confirm modal)

**Style Tableau**:
- En-têtes: fond `#202427`, texte `#a7b0b7`, 12px, uppercase, weight 600
- Lignes: alternance transparent / `rgba(255,255,255,0.01)`
- Bordure cellules: 1px solid `#2b3136`
- Padding: 12px 16px
- Hover ligne: fond `rgba(255,255,255,0.03)`

### Améliorations Clés

**Simulateur de permissions**:
- Bouton "Voir comme cet utilisateur" (icône 👁️)
- Affiche preview avec restrictions de cet utilisateur
- Bouton "Retour admin" pour revenir

**Recherche instantanée**:
- Filtre en temps réel (nom, email, rôle)
- Highlight des termes recherchés
- Compteur résultats: "X utilisateurs trouvés"

**Filtres avancés**:
- Par rôle: Checkboxes multiples
- Par statut: Actif / Inactif / Suspendu
- Par dernière activité: Aujourd'hui / 7j / 30j / Jamais

**État vide intelligent**:
- Si aucun utilisateur: Illustration + "Aucun utilisateur trouvé" + Bouton "Créer le premier utilisateur"
- Si filtre = aucun résultat: "Aucun résultat pour '[terme]'" + Bouton "Réinitialiser filtres"

---

## 📄 PAGE 3: ORGANISATIONS

### Objectif
Pilotage multi-tenant isolé.

### Structure

**Header**:
- Titre: "Organisations"
- Sous-titre: "Liste des organisations créées"
- **Bouton**: "+ Nouvelle organisation" (bleu, coin supérieur droit)

**KPI par Organisation** (bandeau haut, optionnel):
- Grille 3 colonnes:
  * Total organisations
  * Organisations actives
  * Organisations avec incidents

**Tableau Principal**:

**Colonnes**:
1. **Organisation** (2fr)
   - Icône building 🏢
   - Nom organisation en gras
   - Description (petit texte gris, tronqué)
2. **Statut** (1fr)
   - Badge: "Active" (vert) / "Inactive" (gris) / "Suspendue" (orange)
   - Icône statut (✓ vert, ⏸️ gris, ⚠️ orange)
3. **Utilisateurs** (1fr)
   - Nombre utilisateurs (grand, 20-24px)
   - Sous-texte: "actifs" (gris, 11px)
4. **Région** (1fr)
   - Badge région: "FR", "US", "EU", etc.
   - Icône globe 🌍
5. **Créée le** (1fr)
   - Date format: "20.00.00 16" (format compact)
   - Tooltip = date complète
6. **Santé** (1fr)
   - Health score calculé: Badge avec couleur + pourcentage
     * Vert `#34d399`: 90-100% (Excellent)
     * Jaune `#f59e0b`: 70-89% (Bon)
     * Orange `#f97316`: 50-69% (Dégradé)
     * Rouge `#ef4444`: <50% (Critique)
   - Icône indicateur (⚡ vert, ⚠️ orange, ❌ rouge)
7. **Actions** (120px)
   - Bouton "Entrer" (principal, bleu)
   - Menu dropdown (⋮) avec:
     * Voir détails
     * Modifier
     * Dupliquer
     * Suspendre / Activer
     * Supprimer

**Exemple de données** (basé sur image):
- "Qutilestar 1001" | "Monitoring Cloud" | "20.00.00 16" | Statut ✓
- "EastVentures" | "Monitoring Cloud" | "22.00.00 03" | Statut ⚠️

### Améliorations Clés

**Health Score Calculé**:
- Algorithme: CPU <70%, Mémoire <80%, 0 ERR = 100%
- Affichage: Badge circulaire avec pourcentage
- Tooltip détaille: "CPU: 45%, Mémoire: 62%, Erreurs: 0"

**Accès Rapide "Entrer dans l'orga"**:
- Bouton primaire bleu "Entrer" dans colonne Actions
- Switche le contexte vers cette organisation
- Header change pour afficher nom organisation
- Sidebar adapte les menus selon les permissions org

**Alerte Limites**:
- Badge "Limite proche" si utilisateurs > 80% quota
- Badge "Quota dépassé" (rouge) si > 100%
- Tooltip: "85/100 utilisateurs (85%)"

**Section "KEOINGTON"** (bas du tableau):
- Zone d'information ou statistiques supplémentaires
- Texte: "Eatus Flet puer Pre lo egron Prelics"
- Bouton "Observer van loga" (observer les logs)

---

## 📄 PAGE 4: SYSTÈME / SAFE_MODE

### Objectif
Contrôle critique du runtime.

### Structure

**Header**:
- Titre: "Système"
- Sous-titre: "Gestion et configuration du système iCONTROL"

**Section 1: État SAFE_MODE**

**Card** (fond `#1a1d1f`, bordure `#2b3136`):
- **Titre**: "SAFE_MODE - Administration"
- **Badge état actuel**:
  * "OFF" (gris) - Désactivé
  * "COMPAT" (jaune `#f59e0b`) - Compatibilité
  * "STRICT" (rouge `#ef4444`) - Strict
- **Description**: "Système de sécurité et configuration RBAC STRICT"
- **Options affichées**:
  * "Monitor: METRICS" (badge)
  * "Spalicks Q" (option)

**Actions SAFE_MODE**:
- Boutons:
  * "Resetter" (secondaire, bordure)
  * "STRICT" (rouge si actif, secondaire si inactif)
  * "Sébole 131" (action spécifique)
- Inputs:
  * "GUP 660" (valeur config)
  * "EGD 0" (valeur config)

**Section 2: Cache & Audit**

**Card**:
- **Titre**: "Cache & Audit"
- Métriques:
  * Taille cache
  * Nombre entrées audit
  * Dernière purge
- Boutons: "Purge cache", "Exporter audit"

**Section 3: Feature Flags Système**

**Card**:
- Liste de feature flags avec toggles ON/OFF
- Description de chaque flag
- Impact si activé/désactivé

### Améliorations Clés

**Dry-run SAFE_MODE**:
- Bouton "Simuler changement SAFE_MODE"
- Affiche preview des impacts sans appliquer
- Liste modules affectés, permissions qui changent
- Confirmation requise pour appliquer réellement

**Explication Niveaux SAFE_MODE**:
- **OFF**: "Toutes les fonctionnalités actives, aucune restriction"
- **COMPAT**: "Mode compatible, restrictions légères pour sécurité"
- **STRICT**: "Mode strict, sécurité maximale, certaines fonctions désactivées"
- Icône info ℹ️ avec tooltip détaillé

**Historique Changements**:
- Timeline verticale des changements SAFE_MODE
- Date, utilisateur, ancien → nouveau niveau
- Bouton "Restaurer cette configuration"

**Bouton Urgence "Rollback config"**:
- Bouton rouge bien visible en haut
- Modal de confirmation avec code de sécurité
- Restaure config précédente en 1 clic

**Grille Statistiques** (bas de page):
- 3×3 ou 4×3 de boîtes avec pourcentages:
  * "Abonnements systèmes": "0%"
  * "Abonnements CIRV": "0%"
  * "Abonnements reoudles": "0%"
  * Autres métriques système

---

## 📄 PAGE 5: API

### Objectif
Exploitation et diagnostic API professionnel, jamais vide.

### Structure (Layout 3 colonnes)

**Colonne Gauche: Collections API** (280px fixe)
- Liste des endpoints groupés par catégorie
- Catégories: "GET", "POST", "PUT", "DELETE"
- Clic sur endpoint = charge dans centre
- Badge nombre de requêtes par endpoint

**Colonne Centre: Requête Active** (flex: 1)

**Header requête**:
- Tabs: "Cote" (actif), "Clients", "Post", "Actif"

**Section Méthode + URL**:
- Select méthode HTTP: "GET" (par défaut)
- Input endpoint: "/api/resources"
- Bouton "Send" (bleu, dégradé)

**Section Headers**:
- Tableau headers avec clé/valeur
- Bouton "+ Ajouter header"
- Headers communs pré-remplis (Authorization, Content-Type)

**Section Body** (si POST/PUT):
- Éditeur JSON avec syntax highlighting
- Validation JSON en temps réel
- Boutons: "Format", "Validate", "Clear"

**Section Auth**:
- Type: None / Bearer Token / API Key / Basic
- Input token/key selon type
- Bouton "Test auth"

**Colonne Droite: Réponse + Métadonnées** (flex: 1)

**Section Réponse**:
- Status code: "200 OK" (vert) avec badge
- Temps réponse: "66µs" (petit, gris)
- Headers réponse (expandable)
- Body réponse:
  * Format: JSON (défaut) / XML / Text / HTML
  * Syntax highlighting
  * Lignes numérotées
  * Boutons: "Format JSON", "Highlight", "Copy", "Download"

**Section Métadonnées**:
- Correlation ID (copiable)
- Timestamp
- Server time
- Cache hit/miss

**Section Historique** (bas droite):
- Liste dernières 10 requêtes
- Clic = rejouer la requête
- Badge méthode HTTP (couleur selon méthode)

### Métrique Globale

**Grande carte** (haut page):
- "228.0K requêtes" (très grand nombre, 32-48px, poids 700)
- Période: "24h" (sélectable)
- **Graphique camembert** (pie chart):
  * Segment bleu: "GOCIOS" (pourcentage)
  * Segment violet: "Hant Hemorctes" (pourcentage)
  * Segment vert: "A" (pourcentage)
- Légende: "Sumatra, MAN retret, wat"
- Valeur: "2000 10"

### Améliorations Clés

**Temps Réponse Graphique**:
- Sparkline en bas de chaque requête
- Courbe bleue avec zone remplie
- Stats: Avg, Min, Max en bas

**Diff Schéma JSON**:
- Si réponse ≠ schéma attendu: highlight différences
- Rouge = manquant, Jaune = format différent
- Bouton "Voir schéma attendu"

**Correlation ID Affiché**:
- Badge cliquable avec ID
- Clic = filtre logs automatique par correlation ID
- Copie en 1 clic

**Mock Response**:
- Toggle "Mock mode"
- Définir réponse mockée
- Utile pour développement frontend sans backend

**Replay / Clone**:
- Bouton "Replay" sur historique
- Bouton "Clone" pour dupliquer requête
- Pré-remplit formulaire avec valeurs précédentes

---

## 📄 PAGE 6: NETWORK

### Objectif
Compréhension réseau visuelle et exploitable.

### Structure

**Header**:
- Titre: "Network Activity"
- Sous-titre: "Latency performance monitoring."

**Section 1: Timeline Appels Réseau**

**Graphique ligne** (grand, pleine largeur):
- Axe X: Temps (7h00 → 7h00, 24h)
- Axe Y: Latence (40ms, 35ms, 30ms)
- Lignes multiples:
  * "Ray" (bleu `#3b82f6`)
  * "Llap" (violet `#7b2cff`)
  * "Durnice" (vert `#34d399`)
- Zone remplie sous chaque ligne (dégradé transparent)
- Points interactifs au survol (affiche valeurs exactes)

**Filtres** (au-dessus du graphique):
- Boutons: "Ray", "Llap", "Durnice"
- Bouton actif = surligné, ligne visible
- Toggle "Toutes" pour afficher/masquer toutes

**Section 2: Heatmap Endpoints**

**Carte de chaleur**:
- Colonnes: Endpoints
- Lignes: Périodes (1h, 6h, 24h)
- Couleurs: Vert = rapide, Orange = moyen, Rouge = lent
- Valeurs au survol
- Clic = filtre endpoint automatique

**Section 3: Liste Requêtes Lentes**

**Tableau**:
- Colonnes: Endpoint | Temps réponse | Occurrences | Actions
- Tri par temps décroissant
- Badge "LENT" (orange/rouge) si > 500ms
- Bouton "Analyser" → ouvre page Logs filtrée

**Section 4: Corrélation Logs**

**Zone de connexion**:
- Lien vers page Logs
- Filtre automatique par endpoint
- Affiche logs associés aux requêtes réseau

### Améliorations Clés

**Filtre par Action Utilisateur**:
- Dropdown "Action utilisateur"
- Filtre timeline pour montrer seulement les requêtes d'une action spécifique
- Utile pour debug UX

**Comparaison Avant/Après Release**:
- Toggle "Comparer avec release précédente"
- Affiche 2 courbes: avant (gris) / après (bleu)
- Highlight différences significatives

**Export CSV**:
- Bouton "Exporter données" (coin supérieur droit)
- Formats: CSV, JSON, Excel
- Options: Période, Endpoints, Métriques

---

## 📄 PAGE 7: LOGS

### Objectif
Logs lisibles, groupés, actionnables.

### Structure

**Header**:
- Titre: "Logs"
- Tag "SAFE_MODE" (badge jaune `#dcdcaa`)
- Boutons: 🔄 Refresh, 📥 Export

**Barre Filtres** (sous header):
- Dropdown "Module": CORE_SYSTEM, SCAN_MANAGER, etc.
- Dropdown "Severity": INFO, WARN, ERR, ALL
- Input temps: "18:40:06" (filtre par heure)
- Bouton "Période": 1h / 24h / 7j / 30j

**Section Distribution** (haut):
- **Graphique barres** (3 barres):
  * INFO: barre verte haute (75px) - "INFO" label en bas
  * WARN: barre orange moyenne (45px) - "WARN" label
  * ERR: barre rouge basse (15px) - "ERR" label
- Couleurs: Vert `#34d399`, Orange `#f59e0b`, Rouge `#ef4444`
- Effet brillance sur barres (dégradé blanc transparent haut)

**Section Timeline Verticale** (centre, pleine largeur):

**Tabs**:
- "Notouis" (actif), "Coool lep", "2oul", "Soletord"

**Liste Logs** (format timeline):
- Chaque entrée:
  * Icône gauche: ✓ (vert succès) / ◆ (bleu info) / ⚠️ (orange warn) / ❌ (rouge erreur)
  * Texte log: "GT.1.MM 1 RBD", "SPIANOKES", "AJA PRODANORS"
  * Timestamp: format relatif "Il y a 2min" ou absolu "18:40:06"
  * Pourcentage (optionnel): "20%", "98%", "100%"
- **Expandable details** (clic sur ligne):
  * Métadonnées: Module, Severity, User, IP
  * Stack trace (si erreur)
  * Correlation ID
  * Lien vers contrat/page impactée

**Exemple entrées** (basé sur image):
- "FPI request completed /api/resources" (20%)
- "CORE_SYSTEM Vomerx Syeceadey Yolmaax 98:20007" (98%)
- "API request completed: s sccerates" (100%, ✓)
- "Role Dompletelici: 4/successed /api/resources" (100%, ◆)
  * Sous-texte: "/api/resources: token reseutted"
- "Role Developer altered altered [michael]" (100%, ◆)
  * Sous-texte: "Token delected: token fereer too"

**Section Détail Expandable**:
- Clic sur log = expand
- Affichage: Métadonnées complètes, Stack trace, Actions (Copier, Lier, Ignorer)

### Améliorations Clés

**Regroupement Intelligent**:
- Groupe logs similaires (même erreur, même endpoint)
- Affiche: "X occurrences de cette erreur" (badge)
- Clic = expand toutes les occurrences
- Bouton "Grouper/Dégrouper"

**Explication Humaine Erreurs Fréquentes**:
- Si erreur apparaît > 5 fois: badge "Erreur fréquente"
- Tooltip: "Cette erreur indique [explication simple]"
- Bouton "Solutions" → ouvre modal avec suggestions
- Exemple: "Erreur 500 sur /api/users → Vérifier connexion DB"

**Lien Direct Vers Contrat/Page Impactée**:
- Si log lié à un contrat: badge cliquable "[Nom contrat]"
- Clic = navigation vers Registry avec filtre
- Si lié à une page: badge "[Page]" → navigation page

**Section "Recicies or te: Rocit legros"** (bas):
- Collapsible: "> Accong osmeonts"
- Contenu expandé:
  * "Eurecatue modeale retaiece"
  * "Herththe Portfτιος Αθ"
  * "Seropose"
- Style: Fond légèrement différent `rgba(255,255,255,0.02)`

**Progression Circulaire** (optionnel):
- Cercle "32%" avec texte "Hoynger ecit settinge chint ve DEGENTINO intnvoet"
- Indicateur visuel de progression

---

## 📄 PAGE 8: REGISTRY / ÉDITEUR VISUEL

### Objectif
Cœur du système : contrats + UI orchestration.

### Structure

**Header**:
- Titre: "Registry / Éditeur Visuel"
- Badge: "Mode: Premium Actif" (ou "Freemium")
- Tabs: Mode édition / Registry components / Registry routes

**Section 1: Mode Édition Visuelle**

**Toggle** (bien visible):
- "Mode édition activé" / "Mode édition désactivé"
- Bouton ON/OFF avec indicateur visuel

**Quand mode édition activé**:
- Badge "ÉDITION ACTIVE" en haut (orange/rouge)
- Outils d'édition visibles:
  * Palette d'outils flottante
  * Boutons: Ajouter élément, Modifier, Supprimer, Annuler/Refaire
- Sélection éléments:
  * Bordure bleue autour de l'élément sélectionné
  * Panneau propriétés à droite (couleur, taille, position)
- Bouton "Publier" (bleu, bien visible)

**Section 2: Registry Components**

**Tableau** (pleine largeur):

**Colonnes**:
1. **GEF Rondes** (Nom composant) - 2fr
2. **Ptitzerria Tunguke** (Type) - 1fr
3. **Smigrét: οκτάτα** (Statut) - 1fr
4. **Rorget Herrtier** (Actions) - 1fr

**Exemples de lignes** (basé sur image):
- **Heracles**: "Sarict Lt" | "Ceteriler" | "Bloga tv"
- **Gun**: "Dren higgs 01" | "Nemony at Cremител / 0198"
- **Reppertur**: "Doo lings 01" | "OGDEFTEOOP" | "7 Mana Sou toege CLOS"
- **Day**: "Sue hings at" | "Hentturlien Ctse SLOOB Poathecon.co"
- **Goth**: "Boe huggs of"
- **Micro-missions**: "O Axacottos Sterced Ditaarten" | "Soetatags 01"

**Style tableau**:
- Fond `#1a1d1f`, bordures `#2b3136`
- Lignes alternées
- Actions: Boutons modifier, supprimer, dupliquer

**Section Collapsible**:
- "> Accong osmeonts" (expandable)
- Contenu:
  * "Eurecatue modeale retaiece"
  * "Herththe Portfτιος Αθ"
  * "Seropose"

### Améliorations Clés

**Dependency Graph**:
- Vue graphique des dépendances entre composants
- Flèches reliant composants
- Highlight composants critiques (rouge si dépendances multiples)
- Bouton "Vue graphique" / "Vue tableau"

**Impact Analysis**:
- Clic sur composant = "Analyser impact"
- Affiche: Pages utilisant ce composant, Autres composants dépendants
- Avertissement si suppression = impact important

**Versioning Contrats**:
- Badge version: "v1.2.3"
- Historique versions (dropdown)
- Bouton "Comparer versions"
- Diff visuel entre versions

**Rollback UI**:
- Bouton "Restaurer version précédente"
- Sélection version dans dropdown
- Confirmation modal avec preview changements
- Timeline des versions avec dates

**Preview par Rôle**:
- Dropdown "Prévisualiser en tant que: [Rôle]"
- Affiche la page comme la verrait ce rôle
- Utile pour tester permissions

**Draft / Preview / Publish**:
- 3 onglets ou sections:
  * **Draft**: Modifications non publiées (badge orange)
  * **Preview**: Aperçu avant publication (badge bleu)
  * **Published**: Version active (badge vert)
- Bouton "Publier Draft" (bleu, confirm modal)
- Bouton "Republier Preview" (orange)

---

## 📄 PAGE 9: ABONNEMENTS

### Objectif
Freemium lisible, stratégique, non agressif.

### Structure

**Header**:
- Titre: "Abonnements"
- Sous-titre: "Gestion des abonnements et services externes"

**Tabs** (sous header):
- "Freemium" (actif) | "Abonnements" | "Analyse"

### ONGLET 1: Freemium

**Section État Global**:
- Texte: "Fonctionnalités gratuites disponibles"
- Badge: "X fonctionnalités actives"

**Section Liste Fonctionnalités**:
- Cartes fonctionnalités (grille auto-fill, min 280px):
  * Checkmark vert ✓ à gauche
  * Nom fonctionnalité en gras
  * Description courte
  * Icône selon catégorie
- Catégories:
  * "Tablie" (Tables)
  * "Stotrrage" (Storage)
  * "Seanirce" (Sécurité)

**Section Statistiques Freemium**:
- Boîtes (grille 2 colonnes):
  * "Total Fonctionnalités Gratuites": grand nombre (vert)
  * "Taux d'utilisation": pourcentage avec barre

### ONGLET 2: Abonnements

**Section Liste Abonnements**:
- Cartes d'abonnements (grille auto-fill):
  * **Header carte**:
    - Nom abonnement en gras
    - Badge "ACTIF" (vert) ou "INACTIF" (gris)
    - Prix (si applicable)
  * **Contenu**:
    - Liste fonctionnalités incluses (checkmarks verts)
    - Catégories: "OCR avancé", "Monitoring Système", "Connecteurs Cloud"
    - Boutons: "Désactiver", "Satbenad", "Prokidst", "Systeort"
  * **Footer**:
    - Date activation
    - Date expiration (si applicable)

**Bouton Flottant**:
- "+" (cercle bleu, coin inférieur droit)
- Hover = "Ajouter un abonnement"
- Clic = modal création abonnement

**Statistiques** (haut):
- Grille 3 colonnes:
  * "Total actifs": nombre grand (vert `#4ec9b0`)
  * "Total inactifs": nombre (gris)
  * "Revenus" (si applicable): montant

### ONGLET 3: Analyse

**Section Performance Analysis**:
- Graphiques de performance en pourcentages
- Barres ou lignes montrant évolution
- Métriques:
  * "Abonnements systèmes": pourcentage
  * "Abonnements CIRV": pourcentage
  * "Abonnements reoudles": pourcentage
  * Autres catégories

**Tableau Analyse** (si applicable):
- Colonnes: Catégorie | Pourcentage | Statut | Actions
- Lignes par catégorie d'abonnement

**Section "Svicinar avnee Premium"**:
- Tableau avec colonnes:
  * "Ruisestece" (Ressource)
  * "Geetim" (Gestion)
  * "Dremenper" (Développement)
  * "Variriotser" (Variété)
  * "Connectatt" (Connecteurs)
- Lignes:
  * "OCR avancé": boutons "Désactiver", "Satbenad", "Prokidst", "Systeort"
  * "Monitoring Système": mêmes boutons
  * "Connecteurs Cloud": mêmes boutons

### Améliorations Clés

**Feature Matrix Dynamique**:
- Tableau comparatif fonctionnalités × abonnements
- Checkmarks verts = inclus, gris = non inclus
- Badge "Premium" pour fonctionnalités payantes
- Clic fonctionnalité = explication + lien vers abonnement

**Simulation Gain**:
- "Simuler: Activer [Abonnement X]"
- Affiche: Fonctionnalités débloquées, Gain estimé
- Bouton "Voir détails" → page abonnement

**Soft-lock UX**:
- Si fonctionnalité premium cliquée:
  * Modal élégant: "Cette fonctionnalité nécessite [Abonnement]"
  * Bouton "En savoir plus" (vers onglet Abonnements)
  * Bouton "Fermer" (pas agressif)
- Pas de blocage dur (utilisateur peut toujours naviguer)

**Aucun Blocage Fonctionnel**:
- Toutes les pages restent accessibles
- Indicateurs visuels discrets pour fonctionnalités premium
- Focus sur valeur ajoutée, pas restriction

---

## 🎯 AMÉLIORATIONS UX TRANSVERSALES

### Command Palette (⌘K / Ctrl+K)
- Raccourci clavier: Ouvrir command palette
- Recherche globale:
  * Pages ("Dashboard", "Utilisateurs", etc.)
  * Actions ("Créer utilisateur", "Purge cache", etc.)
  * Commandes système
- Affichage: Modal centré avec résultats en temps réel
- Navigation: Flèches haut/bas, Enter pour exécuter

### Raccourcis Clavier
- `⌘K` / `Ctrl+K`: Command palette
- `⌘/` / `Ctrl+/`: Aide raccourcis
- `⌘F` / `Ctrl+F`: Recherche dans page
- `⌘B` / `Ctrl+B`: Toggle sidebar
- `Esc`: Fermer modals, quitter édition

### Skeleton Loaders Partout
- Pendant chargement données:
  * Grisées `rgba(255,255,255,0.05)`
  * Animation pulse douce
  * Forme similaire au contenu final
- Évite "flash blanc" ou contenu qui saute

### Tooltips Systématiques
- Tous les éléments interactifs ont tooltip au survol
- Explications courtes (< 100 caractères)
- Position: En haut ou en bas selon espace
- Style: Fond `#1a1d1f`, bordure `#2b3136`, texte `#e7ecef`

### États Vides Intelligents (Jamais Blanc)
- Illustration ou icône grande
- Message explicatif clair
- Action suggérée (bouton primaire)
- Lien vers documentation si applicable

**Exemples**:
- "Aucun utilisateur" → Illustration + "Créez le premier utilisateur" + Bouton bleu
- "Aucun log" → Icône 🔍 + "Aucun log trouvé pour cette période" + Bouton "Étendre la période"
- "Aucune organisation" → Illustration + "Créez votre première organisation" + Bouton bleu

---

## 🖼️ PROMPTS CHATGPT PAR PAGE

### PROMPT 1: Dashboard Vue Exécutive

```
Génère une image d'interface dashboard dark enterprise avec:

FOND: Noir très foncé `#0f1112`

HEADER (haut, largeur 100%):
- Menu ☰ (gauche) + "Dashboard" (texte blanc)
- Badge "OPÉRATIONNEL" vert `#34d399` (droite)
- Indicateur système avec point vert clignotant + "iCONTROL"

GRille 2×2 (gap 16px, padding 16px):

CARTE 1 (haut gauche) - Santé Système:
- Titre "Santé Système" (14px, blanc)
- 3 métriques: CPU 12% (vert), Mémoire 68% (orange), Temps 10ms (vert)
- Barres de progression ou cercles
- Mini graphique ligne évolution 24h

CARTE 2 (haut droite) - Activité:
- "Activité: 195.4k" (grand, vert) + barre verte
- "Retours API: 17.8K" (bleu) + barre bleue
- "Latence: 1.2k" (violet) + barre violette
- Graphique ligne temps (7h00 → 7h00) avec courbes colorées

CARTE 3 (bas gauche) - Erreurs:
- WARN: nombre (orange)
- ERR: nombre (rouge)
- Graphique barres distribution
- Bouton "Voir logs" (lien bleu)

CARTE 4 (bas droite) - Modules:
- Actifs: X (vert) / Inactifs: Y (gris)
- Badge SAFE_MODE avec niveau
- Liste modules avec statut (✓ vert ou X rouge)

Style: Panneaux `#1a1d1f`, bordures `#2b3136`, texte `#e7ecef`, design épuré moderne
```

---

### PROMPT 2: Page Utilisateurs

```
Génère une image d'interface de gestion d'utilisateurs dark theme:

FOND: `#0f1112`

HEADER:
- Hamburger ☰ + "Utilisateurs" (gauche)
- Bouton bleu "+ Ajouter un utilisateur" (droite)

BARRE OUTILS (sous header):
- Recherche avec icône 🔍
- Filtres dropdown: Rôle, Statut, Application

TABLEAU (pleine largeur, fond `#1a1d1f`):

COLONNES:
1. Nom (large): Avatar 40px + Nom gras + Email gris
2. Rôle: Badge couleur (violet SYSADMIN, bleu ADMIN, vert DEVELOPER, gris USER)
3. Application: Badge "CP" ou "APP"
4. Pages: Liste condensée "Dashboard, Système..." + tooltip hint
5. Dernière activité: "Il y a 2h" (relatif)
6. Actions: Menu dropdown ⋮ (Modifier, MDP, Désactiver, Supprimer)

LIGNES:
- Alternance fond transparent / `rgba(255,255,255,0.01)`
- Hover: fond `rgba(255,255,255,0.03)`
- 5-10 lignes d'exemple avec données réalistes

En-têtes: Fond `#202427`, texte `#a7b0b7`, 12px uppercase

Bouton "Voir comme cet utilisateur" (optionnel, en bas)
```

---

### PROMPT 3: Page Organisations

```
Génère une image d'interface de gestion d'organisations dark theme:

FOND: `#0f1112`

HEADER:
- Hamburger ☰ + "Organisations" (gauche)
- Bouton bleu "+ Nouvelle organisation" (droite)

KPI (bandeau haut, 3 boîtes):
- "Total organisations: X" | "Actives: Y" | "Incidents: Z"

TABLEAU (pleine largeur):

COLONNES:
1. Organisation (2fr): Icône 🏢 + Nom gras + Description grise
2. Statut: Badge "Active" (vert ✓) / "Inactive" (gris ⏸️)
3. Utilisateurs: Nombre grand + "actifs" petit
4. Région: Badge "FR", "US" (avec icône 🌍)
5. Créée le: "20.00.00 16" (format compact)
6. Santé: Badge avec score 90-100% (vert), 70-89% (jaune), <70% (rouge)
7. Actions: Bouton bleu "Entrer" + Menu ⋮

LIGNES EXEMPLE:
- "Qutilestar 1001" | Monitoring Cloud | 20.00.00 16 | ✓ | Health 95%
- "EastVentures" | Monitoring Cloud | 22.00.00 03 | ⚠️ | Health 65%

Section bas: "KEOINGTON" avec texte descriptif + bouton "Observer van loga"

Style: Tableau standard dark theme, bordures `#2b3136`
```

---

### PROMPT 4: Page Système / SAFE_MODE

```
Génère une image d'interface de configuration système dark theme:

FOND: `#0f1112`

HEADER: Hamburger + "Système"

SECTION 1 - SAFE_MODE (carte `#1a1d1f`):
- Titre "SAFE_MODE - Administration"
- Badge état: "STRICT" (rouge) ou "COMPAT" (jaune) ou "OFF" (gris)
- Texte: "Système de sécurité et configuration RBAC STRICT"
- Options: "Monitor: METRICS" (badge), "Spalicks Q"
- Boutons: "Resetter" (secondaire), "STRICT" (rouge), "Sébole 131"
- Inputs: "GUP 660", "EGD 0"

SECTION 2 - Cache & Audit:
- Titre "Cache & Audit"
- Métriques: Taille cache, Nombre entrées
- Boutons: "Purge cache", "Exporter audit"

SECTION 3 - Feature Flags:
- Liste toggles ON/OFF avec descriptions

GRID STATISTIQUES (bas, 4×3):
- Boîtes avec labels gris (11px) et valeurs "0%" grandes (20-24px)
- Exemples: "Abonnements systèmes: 0%", "Abonnements CIRV: 0%"

Bouton urgence rouge "Rollback config" (bien visible en haut)
```

---

### PROMPT 5: Page API

```
Génère une image d'interface de test API dark theme avec layout 3 colonnes:

FOND: `#0f1112`

HEADER: Hamburger + "API"

MÉTRIQUE GLOBALE (haut):
- "228.0K requêtes" (très grand, 32-48px)
- Graphique camembert:
  * Segment bleu "GOCIOS" (grand)
  * Segment violet "Hant Hemorctes" (moyen)
  * Segment vert "A" (petit)
- Légende: "Sumatra, MAN retret, wat"
- Valeur: "2000 10"

COLONNE GAUCHE (280px) - Collections:
- Liste endpoints groupés: GET, POST, PUT, DELETE
- Clic sur endpoint = charge centre

COLONNE CENTRE (flex) - Requête:
- Tabs: "Cote" (actif), "Clients", "Post", "Actif"
- Tableau: Méthodes GET/POST/PUT/DELETE avec colonnes IP, Status, etc.

COLONNE DROITE (flex) - Réponse:
- Status "200 OK" (vert)
- Temps "66µs"
- Body JSON avec syntax highlighting
- Boutons: Format, Copy, Download

HISTORIQUE (bas droite):
- Liste 5-10 dernières requêtes
- Badges méthode (couleurs)
```

---

### PROMPT 6: Page Network

```
Génère une image d'interface de monitoring réseau dark theme:

FOND: `#0f1112`

HEADER: Hamburger + "Network Activity"
Sous-titre: "Latency performance monitoring."

SECTION 1 - Timeline (pleine largeur):
- Graphique ligne avec 3 courbes:
  * "Ray" (bleu `#3b82f6`)
  * "Llap" (violet `#7b2cff`)
  * "Durnice" (vert `#34d399`)
- Axe X: Temps (7h00 → 7h00)
- Axe Y: Latence (40ms, 35ms, 30ms)
- Zones remplies sous courbes (dégradés transparents)
- Boutons filtres: "Ray", "Llap", "Durnice" (actif = surligné)

SECTION 2 - Heatmap (optionnel):
- Carte chaleur endpoints × périodes

SECTION 3 - Requêtes Lentes:
- Tableau: Endpoint | Temps | Occurrences | Actions
- Badge "LENT" (orange) si > 500ms

Bouton export CSV (coin supérieur droit)
```

---

### PROMPT 7: Page Logs

```
Génère une image d'interface de logs dark theme:

FOND: `#0f1112`

HEADER:
- Hamburger + "Logs" + badge jaune "SAFE_MODE" + boutons 🔄 📥

FILTRES (sous header):
- Dropdown "Module": CORE_SYSTEM, etc.
- Dropdown "Severity": INFO, WARN, ERR
- Temps: "18:40:06"

DISTRIBUTION (haut):
- 3 barres verticales:
  * INFO (vert `#34d399`, haute 75px)
  * WARN (orange `#f59e0b`, moyenne 45px)
  * ERR (rouge `#ef4444`, basse 15px)
- Labels en bas chaque barre

TIMELINE LOGS (centre, pleine largeur):
- Tabs: "Notouis" (actif), "Coool lep", "2oul", "Soletord"

LISTE ENTRIES:
- Icônes: ✓ (vert), ◆ (bleu), ⚠️ (orange), ❌ (rouge)
- Texte: "GT.1.MM 1 RBD", "SPIANOKES", "AJA PRODANORS"
- Pourcentages: "20%", "98%", "100%"
- Sous-texte indenté pour détails

SECTION COLLAPSIBLE (bas):
- "> Accong osmeonts" (expandable)
- Texte: "Eurecatue modeale retaiece", "Herththe Portfτιος Αθ"

Progression circulaire: "32%" avec texte descriptif
```

---

### PROMPT 8: Page Registry / Éditeur Visuel

```
Génère une image d'interface Registry dark theme:

FOND: `#0f1112`

HEADER:
- Hamburger + "Registry / Éditeur Visuel"
- Badge "Mode: Premium Actif"

TOGGLE MODE ÉDITION (bien visible):
- Bouton ON/OFF avec indicateur visuel
- Badge "ÉDITION ACTIVE" si activé (orange)

TABLEAU REGISTRY (pleine largeur):

COLONNES:
1. GEF Rondes (Nom) - large
2. Ptitzerria Tunguke (Type)
3. Smigrét: οκτάτα (Statut)
4. Roget Herrtier (Actions)

LIGNES EXEMPLE:
- "Heracles" | "Sarict Lt" | "Ceteriler" | "Bloga tv"
- "Gun" | "Dren higgs 01" | "Nemony at Cremител / 0198"
- "Reppertur" | "Doo lings 01" | "OGDEFTEOOP" | "7 Mana Sou toege CLOS"
- "Day" | "Sue hings at" | "Hentturlien Ctse SLOOB Poathecon.co"
- "Goth" | "Boe huggs of"
- "Micro-missions" | "O Axacottos Sterced Ditaarten" | "Soetatags 01"

SECTION COLLAPSIBLE:
- "> Accong osmeonts"
- Contenu: "Eurecatue modeale retaiece", "Herththe Portfτιος Αθ", "Seropose"

Bouton "Publier" (bleu, bien visible si mode édition actif)
```

---

### PROMPT 9: Page Abonnements

```
Génère une image d'interface d'abonnements dark theme:

FOND: `#0f1112`

HEADER: Hamburger + "Abonnements"

TABS: "Freemium" (actif) | "Abonnements" | "Analyse"

CONTENU (selon onglet actif):

SI "Freemium":
- Texte: "Fonctionnalités gratuites disponibles"
- Grille cartes fonctionnalités (auto-fill, min 280px):
  * Checkmark vert ✓ + Nom + Description
  * Catégories: "Tablie", "Stotrrage", "Seanirce"
- Statistiques: "Total fonctionnalités gratuites: X" (grand nombre vert)

SI "Abonnements":
- Statistiques (3 boîtes): "Total actifs: X" (vert) | "Inactifs: Y" | "Revenus: Z"
- Grille cartes abonnements:
  * Header: Nom + Badge "ACTIF" (vert)
  * Liste fonctionnalités (checkmarks)
  * Boutons: "Désactiver", "Satbenad", "Prokidst"
- Bouton "+" flottant (cercle bleu, coin inférieur droit)

SI "Analyse":
- Graphiques pourcentages (barres ou lignes)
- Tableau "Svicinar avnee Premium":
  * Colonnes: Ruisestece | Geetim | Dremenper | Variriotser | Connectatt
  * Lignes: "OCR avancé", "Monitoring Système", "Connecteurs Cloud"
  * Boutons par ligne

Style cohérent avec autres pages
```

---

## ✅ RÉSULTAT FINAL

Ce document permet:
- ✅ Chaque page reproductible pixel-perfect
- ✅ Aucun doute fonctionnel
- ✅ Aucun choix UX laissé au hasard
- ✅ Produit enterprise-grade crédible
- ✅ Prompts ChatGPT prêts à l'emploi

**Utilisation**: Copiez chaque section "PROMPT X" dans ChatGPT avec "Génère une image selon ces spécifications:"

---

**FIN DE LA SPÉCIFICATION COMPLÈTE**
