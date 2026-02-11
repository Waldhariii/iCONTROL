# Ébauche — Style visuel Enterprise Administration

**Source :** Image de référence « Enterprise Administration Application » (21 vues + login).  
**Objectif :** Appliquer un rendu **extrêmement professionnel** à iCONTROL, avec **graphiques équilibrés** (sans excès) et **fonctions utiles** pour l’administration d’un système d’applications complexes.

---

## 1. Style visuel (couleurs, typo, mise en page)

### 1.1 Palette

| Usage | Variable CSS suggérée | Valeur (référence image) | Rôle |
|-------|----------------------|--------------------------|------|
| Fond principal | `--ea-bg` | `#0d0f11` à `#14171a` | Arrière-plan général |
| Surface / cartes | `--ea-surface` | `#1a1d21` à `#1e2226` | Cartes, panneaux, modales |
| Bordure | `--ea-border` | `#2a2e33` à `#333840` | Contours, séparateurs |
| Texte principal | `--ea-text` | `#e8eaed` à `#f0f2f5` | Titres, corps |
| Texte secondaire | `--ea-muted` | `#9ca3af` à `#adb5bd` | Métadonnées, labels |
| Accent (primaire) | `--ea-accent` | `#3b82f6` à `#4f8cff` | Liens, boutons primaires, traits de graphiques |
| Succès / Online | `--ea-success` | `#22c55e` à `#34d399` | Statuts OK, tendances positives |
| Avertissement | `--ea-warn` | `#f59e0b` à `#fbbf24` | Alertes, dégradation |
| Erreur / Offline | `--ea-error` | `#ef4444` à `#f87171` | Erreurs, incidents |
| Info | `--ea-info` | `#0ea5e9` à `#38bdf8` | Badges, infobulles |

### 1.2 Typographie

- **Sans-serif** : `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- **Titres de page** : 18–22 px, font-weight 600–700
- **Sous-titres / section** : 14–16 px, font-weight 600
- **Corps / tableaux** : 13–14 px, line-height 1.45–1.5
- **Labels, métadonnées** : 11–12 px, `--ea-muted`

### 1.3 Mise en page (inspirée de l’image)

- **Sidebar gauche** : largeur ~240–260 px, fond `--ea-surface`, bordure droite `--ea-border`
- **Header** : hauteur 56–64 px, sticky, bordure bas, icônes (notifications, paramètres, profil)
- **Contenu** : padding 20–24 px, grilles en 1, 2 ou 3 colonnes selon les blocs
- **Cartes** : `border-radius` 8–12 px, `border: 1px solid var(--ea-border)`, ombre légère
- **Tables** : en-têtes en `--ea-muted`, lignes alternées optionnelles (très discret)

---

## 2. Graphiques à intégrer (équilibre : « le plus possible sans trop »)

### 2.1 Déjà présents dans iCONTROL (à conserver / adapter aux couleurs)

- **Line chart** (courbe) : tendances (latence, débit, requêtes, erreurs)
- **Bar chart** (barres) : distribution, comparaisons
- **Donut** : répartition (ex. OK / WARN / ERR, ou par module/source)

### 2.2 À ajouter pour coller au style Enterprise Admin

| Type | Où l’utiliser | Exemple (référence image) |
|------|----------------|----------------------------|
| **Jauge (gauge)** | Tableau de bord, Santé | « Disk Usage (TB) », CPU, mémoire, capacité |
| **Courbe (line)** | Dashboard, Journal, Ventilation | « Network Usage (Mb/s) », requêtes/heure, erreurs dans le temps |
| **Circulaire / donut** | Dashboard, Organisation | « Memory Usage », répartition par tenant/module/statut |
| **Barres horizontales** | KPI, comparaisons | Cible vs valeur, par service/application |
| **Indicateurs de tendance** | KPI, tableaux | Flèches ↑↓ + couleur (vert / rouge) à côté des valeurs |
| **Mini sparklines** | Lignes de tableaux (optionnel) | Petite courbe en fin de ligne pour évolution récente |

### 2.3 Emplacements proposés par page

- **Tableau de bord**
  - 4 KPI en cartes (avec tendance ↑↓ si possible)
  - 1 **jauge** (ex. santé globale ou « Disk / capacité »)
  - 1 **courbe** (ex. activité / requêtes 24 h)
  - 1 **donut** (ex. répartition des statuts ou par module)
  - Bloc « Activité récente » (tableau compact) + éventuel mini‑calendrier

- **Journal (Logs)**
  - Courbe du volume de logs dans le temps (par niveau ou source)
  - Donut répartition ERR / WARN / INFO / DEBUG

- **Organisation (Tenants)**
  - Donut ou barres : actifs / suspendus / inactifs
  - Courbe : évolution du nombre de tenants (si données dispo)

- **Système**
  - Jauges : CPU, mémoire, disque
  - Courbe : latence, débit

- **Audit**
  - Courbe : nombre d’actions par jour/heure
  - Donut : par type d’action ou par utilisateur

- **Ventilation (nouvelle page analytics, voir §4)**
  - Plusieurs courbes et barres : tendances, répartitions, comparaisons (sans surcharger : 3–5 graphiques max par vue).

---

## 3. Fonctions suggérées (que vous n’aviez peut‑être pas imaginées)

Inspirées des 21 vues de l’image, adaptées à une console qui **administre un système d’applications complexes**.

### 3.1 Alarmes (Dashboard / Alarmes)

- **Table** : ID, Description, Sévérité, Statut, Horodatage
- Filtres : Sévérité (Critical / High / Medium / Low), Statut (Ouvert / En cours / Résolu)
- Lien avec les logs et les métriques (ex. seuil dépassé → alarme créée)

### 3.2 KPI Platform (Analytics)

- **Table** : Nom de la mesure, Unité, Valeur, Cible, Statut, **Tendance** (↑↓), Dernière mise à jour
- Permet de voir d’un coup d’œil : valeur actuelle, objectif, et sens d’évolution
- Idéal pour : latence, taux d’erreur, débit, disponibilité, etc.

### 3.3 Segments (Liste / Segments)

- Groupes ou tags (ex. par client, par région, par type d’app) pour filtrer tenants, utilisateurs, services
- Table : ID, Nom, Type, Date de création, Dernière modification

### 3.4 Exports (Exports)

- **Table** : ID, Nom, Type, Statut, Date de création, Dernière modification, **Télécharger**
- Actions : « Nouvelle exportation » (CSV, JSON, etc.), suivi des jobs, lien de téléchargement quand terminé

### 3.5 Ventilation (Analytics / distribution)

- **Page dédiée** à des graphiques de répartition et tendances :
  - Courbes : évolution dans le temps (requêtes, erreurs, connexions)
  - Barres : comparaison par service, par module, par tenant
  - Donut : part de chaque type (ex. par niveau de log, par statut)
- Filtres par période, par source, par application

### 3.6 Réseaux d’activité (optionnel)

- Vue des dépendances ou du trafic entre services/applications
- Table ou graphe simplifié (nœuds = apps/services, arêtes = appels ou flux)

### 3.7 Historique (Données & Historique)

- **Table** : ID, Événement, Utilisateur, Horodatage, Détails
- Complément à l’audit : événements système (déploiements, changements de config, bascules) avec recherche et filtres

### 3.8 Rôles & Permissions (dédié)

- **Table** : ID, Nom, Description, Statut, Date de création, Dernière modification
- Lien avec « Utilisateurs » : attribution des rôles, édition des permissions par rôle

### 3.9 Indicateurs de statut type « Online / Offline »

- Dans les listes (Agents, Services, Tenants) : pastille ou badge **Online / Offline** (ou Actif / Inactif) avec `--ea-success` / `--ea-error`

### 3.10 Interrupteur type « CONTROL » (header)

- Si pertinent pour votre contexte : switch global (ex. mode maintenance, bascule d’environnement) avec état vert / rouge, comme dans les références type Bsinx / Enterprise Admin

---

## 4. Structure de pages et onglets (proposition)

### 4.1 Pages principales (menu / sidebar)

| Page | Contenu type (résumé) | Graphiques principaux |
|------|------------------------|------------------------|
| **Tableau de bord** | KPI, santé, activité récente, alarmes récentes | Jauge, courbe, donut |
| **Alarmes** | Table Alarmes (ID, Description, Sévérité, Statut, Horodatage) | Option : courbe du volume d’alarmes |
| **Analytics – KPI** | Table KPI (mesure, unité, valeur, cible, tendance) | — |
| **Analytics – Ventilation** | Tendance et répartition | Courbes, barres, donut |
| **Organisation** | Tenants, listes (ou équivalent) | Donut, courbe si dispo |
| **Segments** | Table Segments | — |
| **Utilisateurs** | Table Utilisateurs, rôles | — |
| **Rôles & Permissions** | Table Rôles | — |
| **Services** | Table Services, statut Online/Offline | Option : courbe ou jauge par service |
| **Système** | Santé (CPU, mem, disque), SAFE_MODE, etc. | Jauges, courbes |
| **Journal** | Logs (table + filtres) | Courbe volume, donut par niveau |
| **Audit** | Table Audit (Action, User, Timestamp, Statut, Détails) | Courbe actions dans le temps |
| **Historique** | Table Historique (Événement, User, Timestamp, Détails) | — |
| **Exports** | Table Exports + « Nouvelle exportation », colonne Télécharger | — |
| **Paramètres** | Connexions, thème, fonctionnalités, etc. | — |

### 4.2 Onglets (par page, quand utile)

- **Tableau de bord** : `Vue d’ensemble` | `Agents` (si vous avez des agents) | `Alarmes`
- **Analytics** : `KPI` | `Ventilation`
- **Organisation** : `Tenants` | `Listes` (si vous gardez ce concept)
- **Données** : `Journal` | `Historique` | `Audit`
- **Utilisateur & Admin** : `Utilisateurs` | `Rôles & Permissions`

---

## 5. Résumé des livrables pour l’ébauche

1. **Style visuel**
   - Tokens CSS (palette, typo, radius, ombres) dans un thème « Enterprise Admin » (fichier dédié ou `STYLE_ADMIN_FINAL.css`).
   - Application sur : sidebar, header, cartes, tableaux, boutons, champs.

2. **Graphiques**
   - Conserver : line, bar, donut.
   - Ajouter : **jauge (gauge)** ; **indicateurs de tendance** (↑↓) dans les KPI et tableaux.
   - Définir emplacements (tableau de bord, journal, système, audit, ventilation).

3. **Nouvelles fonctions (à prioriser)**
   - Alarmes (table + filtres).
   - KPI Platform (valeur, cible, tendance).
   - Exports (table + « Nouvelle exportation » + Télécharger).
   - Ventilation (page analytics avec courbes, barres, donut).
   - Segments (table).
   - Historique (table).
   - Rôles & Permissions (table + lien avec Utilisateurs).
   - Pastilles Online/Offline (ou Actif/Inactif) dans les listes concernées.

4. **Structure**
   - Menu/sidebar et onglets selon le tableau §4.
   - Routing et squelettes de pages pour : Alarmes, KPI, Ventilation, Segments, Exports, Historique, Rôles & Permissions.

---

## 6. Prochaine étape

Une fois cette ébauche validée (priorisation des fonctions, choix de couleurs définitifs), on pourra :

1. Introduire les **tokens et le thème** Enterprise Admin (couleurs, typo).
2. Étendre **charts** (jauge, tendances) et les placer dans les pages existantes + Ventilation.
3. Implémenter les **nouvelles pages** et **onglets** par ordre de priorité (ex. Alarmes, KPI, Exports, Ventilation, puis Segments, Historique, Rôles).

Si vous précisez quelles fonctions et quelles pages sont prioritaires (et si vous voulez garder ou simplifier des éléments de l’image), l’ébauche pourra être ajustée avant toute implémentation.
