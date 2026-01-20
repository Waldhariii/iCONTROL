# Spécification Visuelle Complète - Interface iCONTROL
## Document pour Génération d'Images par ChatGPT/DALL-E

---

## 📐 SYSTÈME DE DESIGN GLOBAL

### Palette de Couleurs
- **Fond principal (Background)**: `#0f1112` (noir très foncé)
- **Panneaux (Panel)**: `#1a1d1f` (gris très foncé)
- **Panneaux secondaires (Panel2)**: `#202427` (gris foncé légèrement plus clair)
- **Bordures (Line)**: `#2b3136` (gris moyen-foncé)
- **Texte principal (Text)**: `#e7ecef` (gris très clair/blanc cassé)
- **Texte secondaire (Muted)**: `#a7b0b7` (gris moyen)
- **Accent principal**: `#7b2cff` (violet/mauve)
- **Accent secondaire**: `#7c3aed` (violet plus clair)
- **Boutons**: `#262b2f` (fond), `#2e353b` (hover)
- **Succès/Vert**: `#34d399` (vert émeraude)
- **Avertissement/Orange**: `#f59e0b` (orange)
- **Erreur/Rouge**: `#ef4444` (rouge)
- **Info/Bleu**: `#3b82f6` (bleu)

### Typographie
- **Police principale**: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Segoe UI, Roboto, Helvetica, Arial, sans-serif`
- **Taille titre page**: 22px, weight: 900
- **Taille sous-titre**: 13px, color: `#a7b0b7`
- **Taille texte normal**: 13-14px
- **Taille petite**: 11-12px

### Espacements
- **Padding panneaux**: 16px
- **Padding header panneau**: 12px 16px
- **Gap entre éléments**: 8px, 12px, 16px
- **Gap grille panneaux**: 16px
- **Border radius**: 8px (petits), 18px (grands)

### Ombres
- **Ombres panneaux**: `0 12px 40px rgba(0,0,0,.35)`
- **Ombres boutons**: `0 2px 8px rgba(59, 130, 246, 0.3)`

---

## 🏗️ STRUCTURE GLOBALE DE L'INTERFACE

### Header (Barre Supérieure) - FIXE
**Position**: Fixe en haut, largeur 100% de l'écran
**Hauteur**: 60px (ou 48px pour CP)
**Fond**: `rgba(20,22,24,.88)` avec `backdrop-filter: blur(10px)`
**Bordure bas**: 1px solid `#2b3136`

#### Structure Header (de gauche à droite):
1. **Menu Hamburger** (gauche)
   - Icône: ☰ (ou ✕ quand menu ouvert)
   - Taille: 44px × 44px (ou 36px × 36px pour CP)
   - Fond: `#262b2f`
   - Bordure: 1px solid `#2b3136`
   - Border radius: 12px (ou 8px)
   - Position: margin-left: 20px (ou 16px)

2. **Titre "Console"** (après hamburger)
   - Texte: "Console"
   - Police: 15px, weight: 600
   - Couleur: `#e7ecef`
   - Espacement: 12px après hamburger

3. **Champ de recherche** (centre, optionnel)
   - Placeholder: "iCONTROL" ou vide
   - Style: input avec bordure `#2b3136`
   - Padding: 8px 12px

4. **Icône notifications** (droite, avant statut)
   - Icône: 🔔
   - Taille: 32px × 32px
   - Position: margin-right: 12px

5. **Indicateur Statut Système** (extrême droite)
   - Format: Badge avec point lumineux + texte "iCONTROL"
   - Point: 10px × 10px, vert `#34d399` (clignotant doux)
   - Texte: "iCONTROL", 11px, weight: 600
   - Fond: `rgba(255,255,255,0.03)`
   - Border radius: 8px
   - Padding: 6px 12px
   - Animation: Clignotement doux permanent (pulse 3s)

---

## 📋 SIDEBAR (Menu Latéral) - OVERLAY

**Position**: Fixe à gauche, s'ouvre par-dessus le contenu
**Largeur**: 280px (mobile) → 320px (desktop) → 340px (grand écran)
**Hauteur**: 100vh
**Fond**: `#1a1d1f` ou `#202427`
**Bordure droite**: 1px solid `#2b3136`
**Ombre**: `4px 0 12px rgba(0, 0, 0, 0.3)`
**Transform**: `translateX(-100%)` fermé, `translateX(0)` ouvert

### Structure Sidebar (de haut en bas):

1. **Logo/Titre Section** (haut)
   - Texte: "iCONTROL" ou logo
   - Padding: 12px 0
   - Centré
   - Police: 16px, weight: 800

2. **Menu Navigation** (milieu, liste verticale)
   - **"Console"** (section active, surlignée)
     - Fond: `rgba(59, 130, 246, 0.12)`
     - Bordure gauche: 3px solid `#7b2cff`
   - **"Dashboard"** (icône: grille/grid)
   - **"Utilisateurs"** (icône: groupe d'utilisateurs)
   - **"Management"** (icône: engrenage/gear)
   - **"Système"** (icône: serveur/server rack)
   - **"Abonnement"** (icône: enveloppe/envelope)
   - **"Organisation"** (icône: bâtiment/building)
   
   **Style éléments menu**:
   - Padding: 10px 14px (ou 12px 12px)
   - Gap: 10px (icône + texte)
   - Hauteur min: 40px
   - Border radius: 8px
   - Fond hover: `rgba(255,255,255,0.06)`
   - Couleur texte: `#a7b0b7` (inactif), `#e7ecef` (actif)
   - Taille police: 14px

3. **Section Utilisateur** (bas)
   - Avatar circulaire: 40px × 40px
   - Fond: couleur dégradée ou initiales
   - Texte: Initiales ou photo
   - Bouton "Déconnexion": texte souligné
   - Icône Paramètres: ⚙️, 20px

---

## 📄 PAGE 1: DASHBOARD (Onglet "Vérification" actif)

### Layout Global
- **Conteneur principal**: Largeur 100%, padding 0
- **Grille panneaux**: 2 colonnes × 2 lignes (`grid-template-columns: 1fr 1fr`)
- **Gap entre panneaux**: 16px
- **Padding global**: 16px autour de la grille
- **Hauteur**: `calc(100vh - 240px)`, min-height: 600px

### Barre d'Onglets (sous header)
**Position**: Entre header et grille de panneaux
**Fond**: `#202427`
**Hauteur**: ~44px
**Bordure bas**: 1px solid `#2b3136`

**Onglets**:
- **"Vérification"** (actif - souligné bleu `#3b82f6`)
  - Fond: `#1a1d1f`
  - Bordure bas: 2px solid `#3b82f6`
  - Couleur texte: `#e7ecef`, weight: 600
- **"Logs"** (inactif)
  - Fond: transparent
  - Bordure bas: transparent
  - Couleur texte: `#a7b0b7`, weight: 500

### PANEL 1: API Testing (Haut Gauche)

**Container**:
- Fond: `#1a1d1f`
- Bordure: 1px solid `#2b3136`
- Border radius: 0 (panneaux rectangulaires)
- Hauteur: 100% de la cellule grille

**Header du panneau** (padding: 12px 16px):
- **Titre**: "API Testing"
  - Taille: 14px, weight: 600
  - Couleur: `#e7ecef`
- **Actions** (droite du header):
  - 🔄 Bouton Refresh (32px × 32px)
  - 📥 Bouton Export (32px × 32px)
  - Fond transparent, bordure `#2b3136`

**Contenu** (padding: 16px):
1. **Ligne de requête** (display: flex, gap: 8px):
   - Select méthode HTTP: "GET" (défaut)
     - Fond: `#1a1d1f`
     - Bordure: 1px solid `#2b3136`
     - Padding: 8px 12px
   - Input endpoint: "/api/resources"
     - Flex: 1
     - Style similaire au select
   - Bouton "Send" (bleu dégradé)
     - Fond: `linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)`
     - Couleur texte: white
     - Padding: 8px 20px
     - Border radius: 4px
     - Ombre: `0 2px 8px rgba(59, 130, 246, 0.3)`

2. **Onglets** (Headers, Body, Run):
   - Display: flex, gap: 8px
   - Bordure bas: 1px solid `#2b3136`
   - "Headers" actif: bordure bas 2px solid `#3b82f6`

3. **Status** (barre verte):
   - Fond: `rgba(59, 130, 246, 0.1)`
   - Contenu: ✓ (vert `#34d399`) + "Status 200 OK 66µs"
   - Border radius: 4px
   - Padding: 8px

4. **Réponse JSON** (code block):
   - Fond: `#1a1d1f`
   - Bordure: 1px solid `#2b3136`
   - Police: 'Courier New', monospace
   - Taille: 12px
   - Padding: 12px
   - Max-height: 200px, overflow: auto

5. **Actions réponse** (Format JSON, Highlight, Copy):
   - Petits boutons avec bordure
   - Taille police: 11px

### PANEL 2: Logs (Haut Droite)

**Structure similaire à API Testing**:

**Header**:
- Titre: "Logs"
- Tag "SAFE_MODE" (optionnel, à droite du titre)
  - Fond: `rgba(220,220,170,0.15)`
  - Couleur: `#dcdcaa`
  - Padding: 4px 10px
  - Border radius: 6px
- Actions: 🔄 📥

**Contenu**:
1. **Colonnes tableau**: "Module", "Severity", "18:40:06"
   - En-têtes: padding 12px 16px
   - Fond: `#202427`
   - Taille: 12px, weight: 600
   - Couleur: `#a7b0b7`
   - Text-transform: uppercase

2. **Graphique barres** (distribution sévérités):
   - **INFO** (barre verte, haute): `#34d399`
   - **WARN** (barre orange, moyenne): `#f59e0b`
   - **ERR** (barre rouge, basse): `#ef4444`
   - Gap: 8px entre barres
   - Hauteur proportionnelle aux valeurs

3. **Liste de logs** (si affichée):
   - Format tableau ou liste
   - Alternance de couleurs de fond

### PANEL 3: Network Activity (Bas Gauche)

**Header**:
- Titre: "Network Activity"
- Sous-titre: "Latency performance monitoring."

**Contenu**:
1. **Boutons de filtre**: "Ray", "Llap", "Durnice"
   - Style: petits boutons avec bordure
   - Un actif (fond `rgba(59, 130, 246, 0.1)`)

2. **Graphique ligne** (line chart):
   - Axe Y: labels "40ms", "35ms", "30ms"
   - Ligne bleue: `#3b82f6`
   - Zone remplie sous la ligne (dégradé bleu transparent)
   - Fond: `#1a1d1f`
   - Grille: lignes verticales/horizontales subtiles `#2b3136`

3. **Légendes/Métriques**:
   - Valeurs affichées sous le graphique

### PANEL 4: Registry Viewer (Bas Droite)

**Header**:
- Titre: "Registry viewer"
- Texte: "5 contrat(s) affiché(s) sur 11 total"

**Contenu**:
1. **Onglets** (ROLE, TableDef, CoreImpikDef, dey, tools):
   - Style similaire aux autres onglets
   - "ROLE" actif (souligné)

2. **Dropdown**: "Contracts" → "Tous les contrats"

3. **Liste des contrats**:
   - Icône document/fichier (12px)
   - Texte nom contrat: "EEDOPCCEEIT", "EDT Ar"
   - Dropdowns: "Sisten", "Detimabes", "Coa sissiner"
   - Texte associé: "Retleerdeb Otement, Obnict 5568"
   - Format: lignes avec gap 12px

---

## 📄 PAGE 2: DASHBOARD (Onglet "Logs" actif)

**Même structure que page Dashboard, mais contenu différent**:
- Onglet "Logs" actif (souligné bleu)
- Onglet "Vérification" inactif
- Contenu de la zone principale adapté aux logs

---

## 📄 PAGE 3: UTILISATEURS

**Layout**: Liste ou tableau plein écran

**Header de page**:
- Titre: "Utilisateurs"
- Sous-titre: "Gestion des utilisateurs du système"
- Bouton: "Nouveau utilisateur" (bleu, coin supérieur droit)

**Contenu**:
- **Tableau utilisateurs**:
  - Colonnes: "Nom", "Email", "Rôle", "Statut", "Actions"
  - En-têtes: fond `#202427`, texte `#a7b0b7`, 12px, uppercase
  - Lignes: alternance fond transparent / `rgba(255,255,255,0.01)`
  - Bordures: 1px solid `#2b3136`
  - Padding cellules: 12px 16px

- **Statut badges**:
  - Actif: vert `#34d399`
  - Inactif: gris `#a7b0b7`
  - Suspendu: orange `#f59e0b`

---

## 📄 PAGE 4: MANAGEMENT

**Structure**: Sections avec configurations

**Sections principales**:
1. **Configuration système**
   - Panneaux avec formulaires
   - Inputs et selects
   - Boutons d'action

2. **Paramètres sécurité**
   - Checkboxes
   - Toggles ON/OFF
   - Valeurs numériques

---

## 📄 PAGE 5: SYSTÈME

**Header**:
- Titre: "Système"
- Sous-titre: "Gestion et configuration du système iCONTROL"

**Contenu**:
1. **Boîtes statistiques** (grille 3 colonnes):
   - Fond: `rgba(255,255,255,0.02)`
   - Bordure: 1px solid `#3e3e3e`
   - Border radius: 8px
   - Padding: 16px ou 20px
   - **Labels**: Taille 11px, couleur `#858585`
   - **Valeurs**: Taille 20-24px, weight: 700, couleur `#d4d4d4` ou accent

2. **Tableau "Fonctionnalités par Catégorie"**:
   - Colonnes: "Enimistimaton", "Сезарринов", "Senirier"
   - Lignes: "Tablie", "Stotrrage", "Seanirce"
   - Valeurs numériques dans les cellules

---

## 📄 PAGE 6: ABONNEMENT

**Structure**: Onglets "Freemium", "Abonnements", "Analyse"

### Onglet "Freemium":
- Liste des fonctionnalités gratuites
- Checkmarks verts `#34d399`
- Descriptions textuelles

### Onglet "Abonnements":
- Liste des abonnements actifs
- Cartes d'abonnement avec détails
- Boutons d'action (Activer/Désactiver)

### Onglet "Analyse":
- Graphiques de performance
- Statistiques en pourcentages
- Tableaux de données

---

## 📄 PAGE 7: ORGANISATION

**Header**:
- Titre: "Organisations"
- Sous-titre: "Liste des organisations créées"
- Bouton: "Nouvelle organisation" (coin supérieur droit)

**Contenu**:
- **Liste organisations**:
  - Cartes ou lignes d'organisation
  - Icône: 📍 (pin de localisation)
  - Texte: nom organisation
  - Informations: nombre utilisateurs, statut

---

## 🎨 DÉTAILS VISUELS COMMUNS

### Panneaux (Style commun):
- Fond: `#1a1d1f`
- Bordure: 1px solid `#2b3136`
- Border radius: 0 (rectangulaires)
- Overflow: hidden
- Display: flex, flex-direction: column
- Hauteur: 100% de la cellule grille

### Headers de panneaux:
- Fond: `#1a1d1f` ou `#202427`
- Bordure bas: 1px solid `#2b3136`
- Padding: 12px 16px
- Display: flex, justify-content: space-between
- Alignement vertical: center

### Boutons:
- **Primaire (bleu)**: 
  - Fond: `linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)`
  - Couleur texte: white
  - Ombre: `0 2px 8px rgba(59, 130, 246, 0.3)`
- **Secondaire**: 
  - Fond: transparent
  - Bordure: 1px solid `#2b3136`
  - Couleur texte: `#e7ecef`
- **Icône**: 
  - Fond: transparent
  - Bordure: 1px solid `#2b3136`
  - Taille: 32px × 32px

### Inputs/Selects:
- Fond: `#1a1d1f` ou `#121516`
- Bordure: 1px solid `#2b3136`
- Couleur texte: `#e7ecef`
- Padding: 8px 12px ou 10px 12px
- Border radius: 4px ou 12px

### Tableaux:
- Fond: `#1a1d1f`
- Bordures: 1px solid `#2b3136`
- En-têtes: fond `#202427`, texte `#a7b0b7`, 12px, uppercase
- Cellules: padding 12px 16px
- Alternance de lignes: transparent / `rgba(255,255,255,0.01)`

### Graphiques:
- Fond: `#1a1d1f` ou `linear-gradient(135deg, #1a1d1f 0%, #1e2225 100%)`
- Grille: lignes subtiles `#2b3136`
- Couleurs: bleu `#3b82f6`, vert `#34d399`, orange `#f59e0b`, rouge `#ef4444`

---

## 📐 DIMENSIONS ET POSITIONNEMENT

### Grille Dashboard (2×2):
- Container: width 100%, padding 16px
- Gap: 16px
- Colonnes: `1fr 1fr` (50% / 50%)
- Lignes: `1fr 1fr` (50% / 50%)
- Hauteur totale: `calc(100vh - 240px)`

### Hauteurs:
- Header: 60px (ou 48px CP)
- Barre onglets: ~44px
- Sidebar: 100vh
- Panneaux: 100% de la cellule grille

### Largeurs:
- Sidebar: 280px → 320px → 340px
- Header: 100vw
- Contenu principal: 100% (largeur pleine)

---

## 🎯 ÉTATS INTERACTIFS

### Hover:
- Boutons: fond `rgba(255,255,255,0.05)`
- Items menu: fond `rgba(255,255,255,0.06)`
- Lignes tableau: fond `rgba(255,255,255,0.02)`

### Actif/Selected:
- Onglets: bordure bas 2px bleu `#3b82f6`
- Items menu: fond `rgba(59, 130, 246, 0.12)`, bordure gauche 3px violet
- Boutons sélectionnés: fond accent

### Focus:
- Outline: 2px solid `#7b2cff`
- Outline-offset: 2px

---

## 📱 RESPONSIVE BREAKPOINTS

- **Mobile**: < 768px - Sidebar overlay, grille 1 colonne
- **Tablet**: ≥ 768px - Sidebar overlay, grille 2 colonnes
- **Desktop**: ≥ 1024px - Sidebar visible, grille 2×2
- **Large**: ≥ 1920px - Sidebar 340px, même layout

---

## 🖼️ NOTES POUR GÉNÉRATION D'IMAGES

1. **Thème sombre**: Tous les éléments sur fond très sombre (`#0f1112`)
2. **Contraste élevé**: Texte clair (`#e7ecef`) sur fond sombre
3. **Couleurs d'accent**: Utiliser bleu, violet, vert pour les éléments interactifs
4. **Ombres douces**: Ombres subtiles pour la profondeur
5. **Bordures subtiles**: Bordures fines `#2b3136` partout
6. **Typographie**: Police système moderne (SF Pro, Segoe UI)
7. **Icônes**: Style moderne, épuré (émojis ou icônes Unicode)
8. **Espacement généreux**: Beaucoup d'air entre les éléments
9. **Layout propre**: Alignements précis, grilles régulières
10. **Indicateurs visuels**: Points lumineux clignotants pour le statut

---

**FIN DE LA SPÉCIFICATION**

*Ce document peut être utilisé pour générer des images fidèles de chaque page de l'interface iCONTROL.*
