# 🎨 PROMPTS POUR GÉNÉRATION D'IMAGES - INTERFACE iCONTROL
## Document prêt à copier-coller dans ChatGPT/DALL-E

---

## 📋 SYSTÈME DE DESIGN (À utiliser avec chaque prompt)

**Couleurs principales**:
- Fond: `#0f1112` (noir très foncé)
- Panneaux: `#1a1d1f` (gris très foncé)
- Bordures: `#2b3136` (gris moyen)
- Texte: `#e7ecef` (gris très clair)
- Accent bleu: `#3b82f6`
- Accent violet: `#7b2cff`
- Succès vert: `#34d399`

**Police**: Système moderne (SF Pro, Segoe UI)
**Style**: Dark theme professionnel, épuré, moderne

---

## 🖼️ IMAGE 1: PAGE DASHBOARD - ONGLET VÉRIFICATION

```
Génère une image d'une interface web administrative dark theme avec les spécifications suivantes:

**HEADER (haut, largeur 100%)**:
- Fond gris très foncé `#202427`, hauteur 48px, bordure bas `#2b3136`
- Gauche: Menu hamburger ☰ (carré 36px, fond `#262b2f`) + Texte "Console" (15px, poids 600)
- Droite: Icône notification 🔔 + Badge "iCONTROL" avec point vert clignotant (10px) + texte "iCONTROL" (11px)

**BARRE D'ONGLETS** (sous header):
- Fond `#202427`, hauteur 44px
- Onglet "Vérification" (actif): fond `#1a1d1f`, bordure bas 2px bleu `#3b82f6`, texte blanc
- Onglet "Logs" (inactif): fond transparent, texte gris `#a7b0b7`

**CONTENU PRINCIPAL** (grille 2 colonnes × 2 lignes, fond `#0f1112`):

**PANNEAU 1 - API Testing** (haut gauche):
- Fond `#1a1d1f`, bordure `#2b3136`
- Header: "API Testing" (14px, poids 600) + boutons 🔄 📥 à droite
- Contenu:
  * Ligne: Select "GET" + Input "/api/resources" + Bouton bleu "Send"
  * Onglets: "Headers" (actif, souligné bleu), "Body", "Run"
  * Barre verte: ✓ "Status 200 OK 66µs"
  * Code JSON dans bloc monospace
  * Petits boutons "Format JSON", "Highlight", "Copy"
  * Mini graphique ligne (sparkline bleue) avec stats Avg/Min/Max

**PANNEAU 2 - Logs** (haut droite):
- Fond `#1a1d1f`, bordure `#2b3136`
- Header: "Logs" + badge jaune "SAFE_MODE" + boutons 🔄 📥
- Contenu:
  * Dropdowns "Module", "Severity", heure "18:40:06"
  * Graphique barres: 3 barres (INFO vert haute 75px, WARN orange moyenne 45px, ERR rouge basse 15px)
  * Liste de logs avec icônes ✓ ou ◆ et pourcentages

**PANNEAU 3 - Network Activity** (bas gauche):
- Fond `#1a1d1f`, bordure `#2b3136`
- Header: "Network Activity" + sous-titre "Latency performance monitoring."
- Contenu:
  * Boutons "Ray", "Llap", "Durnice"
  * Graphique ligne bleue avec axe Y (40ms, 35ms, 30ms)
  * Zone remplie sous la ligne (dégradé bleu transparent)

**PANNEAU 4 - Registry Viewer** (bas droite):
- Fond `#1a1d1f`, bordure `#2b3136`
- Header: "Registry Viewer" + texte "5 contrat(s) affiché(s) sur 11 total" + boutons 🔄 📥
- Contenu:
  * Onglets "ROLE" (actif), "TableDef", "CoreImpikDef", "dey", "tools"
  * Dropdown "Contracts: Tous les contrats"
  * Liste: Icône document + "EEDOPCCEEIT" + dropdowns + texte associé
  * Autres lignes similaires

**STYLE GÉNÉRAL**:
- Tous les panneaux ont la même largeur dans la grille 2×2
- Espacement de 16px entre panneaux
- Texte clair sur fond sombre
- Bordures subtiles partout
- Design épuré et professionnel
```

---

## 🖼️ IMAGE 2: PAGE DASHBOARD - ONGLET LOGS

```
Même structure que l'IMAGE 1, mais:
- Onglet "Logs" est actif (fond `#1a1d1f`, bordure bas bleue)
- Onglet "Vérification" est inactif
- Le contenu principal affiche une interface de visualisation de logs avec:
  * Filtres de recherche et sélection de module/sévérité
  * Tableau de logs avec colonnes "Module", "Severity", "Time"
  * Graphiques de distribution des logs
  * Liste détaillée des entrées de logs avec timestamps
```

---

## 🖼️ IMAGE 3: PAGE UTILISATEURS

```
Interface dark theme avec:

**HEADER** (identique à IMAGE 1)

**TITRE PAGE**:
- "Utilisateurs" (22px, poids 900, couleur `#e9e0ff`)
- Sous-titre gris "Gestion des utilisateurs du système"
- Bouton bleu "Nouveau utilisateur" coin supérieur droit

**CONTENU**:
- **Tableau plein écran**:
  * En-têtes: "Nom" | "Email" | "Rôle" | "Statut" | "Actions"
  * Fond en-têtes: `#202427`, texte `#a7b0b7`, 12px, uppercase
  * Lignes alternées: transparent / `rgba(255,255,255,0.01)`
  * Colonnes: Texte nom, email, badge rôle, badge statut (Actif vert / Inactif gris), boutons actions
  * Padding cellules: 12px 16px

**BADGES STATUT**:
- Actif: fond vert `#34d399`, texte blanc
- Inactif: fond gris, texte gris

**Boutons actions**: Petits boutons avec icônes (modifier, supprimer)
```

---

## 🖼️ IMAGE 4: PAGE MANAGEMENT

```
Interface dark theme avec:

**HEADER** (identique)

**TITRE**: "Management" (22px)

**SECTIONS** (pleine largeur, fond `#1a1d1f`):

**Section 1 - Configuration Système**:
- Titre "Configuration système"
- Formulaire avec inputs et selects
- Checkboxes et toggles
- Boutons d'action (Reset, Save, etc.)

**Section 2 - Paramètres Sécurité**:
- Titre "SAFE-MODE - Administration"
- Texte: "Système de sécurité et configuration RBAC STRICT"
- Options: "Monitor: METRICS", "Spalicks Q"
- Boutons: "Resetter", "STRICT", "Sébole 131"
- Inputs: "GUP 660", "EGD 0"

**Section 3 - Application**:
- "Administrateur actuel" avec bouton "Master"
- Informations système affichées

Tous les éléments sur fond `#1a1d1f` avec bordures `#2b3136`
```

---

## 🖼️ IMAGE 5: PAGE SYSTÈME

```
Interface dark theme avec:

**HEADER** (identique)

**TITRE**: "Système" (22px)
**SOUS-TITRE**: "Gestion et configuration du système iCONTROL"

**GRID STATISTIQUES** (3 colonnes):
- 3 boîtes côte à côte avec:
  * Label gris petit (11px): "Abonnements systèmes"
  * Valeur grande (20-24px, poids 700): "0%"
  * Fond: `rgba(255,255,255,0.02)`, bordure `#3e3e3e`, padding 16px

**TABLEAU "Fonctionnalités par Catégorie"**:
- Colonnes: "Enimistimaton", "Сезарринов", "Senirier"
- Lignes: "Tablie", "Stotrrage", "Seanirce"
- Valeurs numériques dans les cellules
- Style tableau standard (en-têtes `#202427`, bordures `#2b3136`)

**Autres sections** avec métriques système et configurations
```

---

## 🖼️ IMAGE 6: PAGE ABONNEMENT - ONGLET FREEMIUM

```
Interface dark theme avec:

**HEADER** (identique)

**ONGLETS** (sous header):
- "Freemium" (actif, souligné bleu)
- "Abonnements" (inactif)
- "Analyse" (inactif)

**TITRE**: "Abonnements"
**SOUS-TITRE**: "Gestion des abonnements et services externes"

**CONTENU**:
- **Section "Freemium gratuites"**:
  * Paragraphe descriptif des fonctionnalités gratuites
  * Liste avec checkmarks verts ✓
  * Cartes de fonctionnalités avec descriptions

- **Statistiques**:
  * Boîtes avec valeurs (Total fonctionnalités, Actives, etc.)
  * Couleurs: bleu `#3b82f6`, vert `#34d399`

Tous les éléments sur fond sombre avec bordures subtiles
```

---

## 🖼️ IMAGE 7: PAGE ABONNEMENT - ONGLET ABONNEMENTS

```
Même structure que IMAGE 6, mais onglet "Abonnements" actif:

**CONTENU**:
- **Liste des abonnements**:
  * Cartes d'abonnement avec titre
  * Statut "ACTIF" (badge vert)
  * Détails: catégories, fonctionnalités incluses
  * Boutons: "Activer", "Désactiver", "Configurer"

- **Bouton flottant** "+" (cercle bleu, coin inférieur droit) pour ajouter abonnement

- **Statistiques en haut**:
  * "Total actifs": nombre en grand (vert `#4ec9b0`)
  * Autres métriques dans des boîtes
```

---

## 🖼️ IMAGE 8: PAGE ABONNEMENT - ONGLET ANALYSE

```
Même structure, onglet "Analyse" actif:

**CONTENU**:
- **Graphiques de performance**:
  * Graphique en barres ou lignes montrant pourcentages
  * Axes avec labels
  * Couleurs différentes par catégorie

- **Tableau d'analyse**:
  * Colonnes: Catégories, Pourcentages, Statut
  * Données d'abonnements par catégorie

- **Métriques**:
  * Boîtes avec pourcentages d'abonnements actifs
  * Couleurs codées (vert = actif, gris = inactif)
```

---

## 🖼️ IMAGE 9: PAGE ORGANISATION

```
Interface dark theme avec:

**HEADER** (identique)

**TITRE**: "Organisations"
**SOUS-TITRE**: "Liste des organisations créées"
**Bouton**: "Nouvelle organisation" (bleu, coin supérieur droit)

**CONTENU**:
- **Liste des organisations**:
  * Cartes ou lignes avec:
    - Icône pin 📍
    - Nom organisation (ex: "sutdele Of Ratat")
    - Nombre d'utilisateurs
    - Statut (actif/inactif)
    - Boutons actions

- **Statistiques** (optionnel en haut):
  * Grille 3 colonnes avec métriques (Total, Actives, etc.)

Style cohérent avec les autres pages
```

---

## 📝 INSTRUCTIONS GÉNÉRALES POUR CHATGPT

Pour chaque image, utilisez ces instructions:

1. **Thème sombre strict**: Fond `#0f1112`, panneaux `#1a1d1f`
2. **Typographie moderne**: Police système (SF Pro, Segoe UI)
3. **Contraste élevé**: Texte clair `#e7ecef` sur fond très sombre
4. **Bordures subtiles**: Lignes fines `#2b3136` partout
5. **Couleurs d'accent**: Bleu `#3b82f6`, Vert `#34d399`, Violet `#7b2cff`
6. **Ombres douces**: Ombres légères pour profondeur
7. **Espacement généreux**: Air entre éléments (16px gaps)
8. **Icônes modernes**: Style épuré (émojis ou Unicode)
9. **Layout propre**: Grilles régulières, alignements précis
10. **Pas de marges blanches**: Contenu plein écran, panneaux bord à bord

**Format image recommandé**: 1920×1080px ou 16:9, résolution haute qualité

---

**FIN DU DOCUMENT**

*Copiez chaque section "IMAGE X" dans ChatGPT pour générer les visuels correspondants.*
