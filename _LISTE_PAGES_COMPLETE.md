# Liste Complète des Pages du Système iCONTROL

## Pages Spécifiques par Application

### Application CLIENT (`/app`)

| Route | Nom Affiché | Description | Accessible |
|-------|-------------|-------------|------------|
| `/app/#/login` | **Connexion - Application Client** | Page de connexion pour les utilisateurs clients | Public |
| `/app/#/dashboard` | **Tableau de bord - Client** | Vue d'ensemble des dossiers et activités clients | Privé |
| `/app/#/system` | **Système - Application Client** | Informations système pour l'application client | Privé |
| `/app/#/settings` | **Paramètres - Application Client** | Configuration des préférences utilisateur client | Privé |
| `/app/#/users` | **Utilisateurs - Application Client** | Gestion des utilisateurs de l'application client | Privé |
| `/app/#/account` | **Mon Compte - Application Client** | Informations et paramètres du compte client | Privé |

### Application ADMINISTRATION (`/cp`)

| Route | Nom Affiché | Description | Accessible |
|-------|-------------|-------------|------------|
| `/cp/#/login` | **Connexion - Administration** | Page de connexion pour les administrateurs | Public |
| `/cp/#/dashboard` | **Tableau de bord - Administration** | Vue d'ensemble du système et des utilisateurs | Privé |
| `/cp/#/system` | **Système - Administration** | Configuration et monitoring du système | Privé |
| `/cp/#/settings` | **Paramètres - Administration** | Configuration globale du système et paramètres d'administration | Privé |
| `/cp/#/users` | **Utilisateurs - Administration** | Gestion complète des utilisateurs du système | Privé |
| `/cp/#/account` | **Mon Compte - Administration** | Informations et paramètres du compte administrateur | Privé |

## Pages RESTREINTES par Application

### Application CLIENT (`/app`) — Pages Uniques

| Route | Nom Affiché | Description | Accessible |
|-------|-------------|-------------|------------|
| `/app/#/dossiers` | **Dossiers** | Gestion des dossiers (CLIENT uniquement) | Privé (APP seulement) |

### Application ADMINISTRATION (`/cp`) — Pages Uniques

| Route | Nom Affiché | Description | Accessible |
|-------|-------------|-------------|------------|
| `/cp/#/developer` | **Développeur** | Outils de développement | Privé (CP seulement) |
| `/cp/#/developer/entitlements` | **Droits Développeur** | Gestion des droits développeur | Privé (CP seulement) |
| `/cp/#/logs` | **Logs** | Consultation des logs système | Privé (CP seulement) |
| `/cp/#/toolbox` | **Toolbox - Édition Visuel** | Boîte à outils pour modifier le visuel des pages (MODAL) | Privé (CP seulement) |
| `/cp/#/verification` | **Vérification** | Page de vérification | Privé (CP seulement) |

## Pages Partagées (Accessibles dans les Deux Applications)

| Route | Nom Affiché | Description | Accessible Dans |
|-------|-------------|-------------|-----------------|
| `/app/#/activation` ou `/cp/#/activation` | **Activation** | Activation et licence | APP et CP |
| `/app/#/access-denied` ou `/cp/#/access-denied` | **Accès Refusé** | Page d'erreur d'accès refusé | APP et CP |
| `/app/#/runtime-smoke` ou `/cp/#/runtime-smoke` | **Runtime Smoke Test** | Tests de smoke runtime (page technique) | APP et CP |
| `/app/#/blocked` ou `/cp/#/blocked` | **Accès bloqué** | Page affichée quand une version est bloquée par une policy | APP et CP |
| `/app/#/settings/branding` ou `/cp/#/settings/branding` | **Parametres — Identité & marque** | Configuration de l'identité et de la marque (SYSADMIN/DEVELOPER requis) | APP et CP (désactivé actuellement) |

## Pages Techniques / Système

| Route | Nom Affiché | Description | Accessible Dans |
|-------|-------------|-------------|-----------------|
| `/app/#/notfound` ou `/cp/#/notfound` | **Page introuvable** | Page d'erreur 404 affichée pour les routes inexistantes | APP et CP |

## Résumé

### Pages Distinctes par Application (12 pages)
- **6 pages pour `/app`** : login, dashboard, system, settings, users, account
- **6 pages pour `/cp`** : login, dashboard, system, settings, users, account

### Pages Restreintes par Application (6 pages)
- **1 page pour `/app` uniquement** : Dossiers
- **5 pages pour `/cp` uniquement** : Developer, Developer Entitlements, Logs, Toolbox (MODAL), Verification

### Pages Partagées (5 pages)
- Activation, Access Denied, Runtime Smoke, Blocked, Settings/Branding (désactivé)

### Pages Système (1 page)
- Not Found (404)

### Total : **23 pages** dans le système (22 actives + 1 technique)

## Restrictions par Application

### Application CLIENT (`/app`)
- ✅ **Pages spécifiques** : Login, Dashboard, System, Settings, Users, Account
- ✅ **Pages restreintes APP** : Dossiers
- ❌ **Bloquées** : Developer, Developer Entitlements, Logs, Toolbox, Verification

### Application ADMINISTRATION (`/cp`)
- ✅ **Pages spécifiques** : Login, Dashboard, System, Settings, Users, Account
- ✅ **Pages restreintes CP** : Developer, Developer Entitlements, Logs, Toolbox (MODAL), Verification
- ❌ **Bloquées** : Dossiers

## Notes

1. **Pages spécifiques** : Chaque application a ses propres versions de login, dashboard, system, settings, users et account avec un contenu différent.

2. **Pages restreintes** : Certaines pages sont limitées à une seule application :
   - **Dossiers** : Uniquement dans `/app` (client)
   - **Developer, Logs, Verification, Toolbox** : Uniquement dans `/cp` (administration)

3. **Toolbox en Modal** : La page Toolbox s'ouvre dans une fenêtre modale overlay pour modifier le visuel des pages. Elle n'est accessible que dans l'application administration.

4. **Pages partagées** : Les pages (activation, access-denied, runtime-smoke, blocked, settings/branding) sont partagées entre les deux applications et utilisent le même rendu.

5. **Pages techniques** :
   - **Runtime Smoke** : Page de test technique pour le runtime
   - **Blocked** : Affichée automatiquement quand une version est bloquée par une policy de gouvernance
   - **Not Found** : Page d'erreur 404 pour les routes inexistantes
   - **Settings/Branding** : Configuration de l'identité et de la marque (actuellement commentée dans moduleLoader.ts)

5. **Routage automatique** : Le système détecte automatiquement si l'utilisateur accède via `/app` ou `/cp` et affiche la page appropriée. Les tentatives d'accès à des pages bloquées affichent un message d'erreur.

6. **Authentification** : Les pages marquées "Privé" nécessitent une authentification. Les pages "Public" sont accessibles sans authentification.
