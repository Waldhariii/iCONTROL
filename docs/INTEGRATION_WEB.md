# 🌐 Guide d'Intégration Web - iCONTROL

**Date:** 2026-01-14  
**Version:** 1.0

---

## 📋 Vue d'ensemble

Ce guide explique comment intégrer iCONTROL dans un site web existant avec reverse proxy (nginx/apache).

---

## 🏗️ Architecture

iCONTROL est conçu pour fonctionner sous un reverse proxy avec deux surfaces:

- **Application Client:** `/app` → `dist/app`
- **Application Administration:** `/cp` → `dist/cp`

---

## ⚙️ Configuration Nginx

### Configuration de base

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    # Application Client
    location /app {
        alias /chemin/vers/iCONTROL/dist/app;
        try_files $uri $uri/ /app/index.html;
        
        # Headers pour SPA
        add_header Cache-Control "no-store" always;
        
        # CORS si nécessaire
        # add_header Access-Control-Allow-Origin "*" always;
    }

    # Application Administration
    location /cp {
        alias /chemin/vers/iCONTROL/dist/cp;
        try_files $uri $uri/ /cp/index.html;
        
        # Headers pour SPA
        add_header Cache-Control "no-store" always;
    }

    # API Runtime Config
    location ~ ^/(app|cp)/api/runtime-config$ {
        proxy_pass http://127.0.0.1:4176;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS si nécessaire
        # add_header Access-Control-Allow-Origin "*" always;
    }

    # Assets statiques (optionnel, si servis par nginx)
    location /assets {
        alias /chemin/vers/iCONTROL/dist/assets;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Redirections
    location = /app {
        return 302 /app/;
    }
    
    location = /cp {
        return 302 /cp/;
    }
}
```

### Avec HTTPS

```nginx
server {
    listen 443 ssl http2;
    server_name votre-domaine.com;

    ssl_certificate /chemin/vers/cert.pem;
    ssl_certificate_key /chemin/vers/key.pem;

    # ... même configuration que ci-dessus ...
}

# Redirection HTTP → HTTPS
server {
    listen 80;
    server_name votre-domaine.com;
    return 301 https://$server_name$request_uri;
}
```

---

## ⚙️ Configuration Apache

### Configuration de base (.htaccess ou VirtualHost)

```apache
<VirtualHost *:80>
    ServerName votre-domaine.com
    DocumentRoot /chemin/vers/iCONTROL/dist

    # Application Client
    Alias /app /chemin/vers/iCONTROL/dist/app
    <Directory "/chemin/vers/iCONTROL/dist/app">
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        # Fallback SPA
        RewriteEngine On
        RewriteBase /app/
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /app/index.html [L]
        
        # Headers
        Header set Cache-Control "no-store"
    </Directory>

    # Application Administration
    Alias /cp /chemin/vers/iCONTROL/dist/cp
    <Directory "/chemin/vers/iCONTROL/dist/cp">
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        # Fallback SPA
        RewriteEngine On
        RewriteBase /cp/
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /cp/index.html [L]
        
        # Headers
        Header set Cache-Control "no-store"
    </Directory>

    # API Runtime Config (reverse proxy)
    ProxyPreserveHost On
    ProxyPass /app/api/runtime-config http://127.0.0.1:4176/app/api/runtime-config
    ProxyPassReverse /app/api/runtime-config http://127.0.0.1:4176/app/api/runtime-config
    
    ProxyPass /cp/api/runtime-config http://127.0.0.1:4176/cp/api/runtime-config
    ProxyPassReverse /cp/api/runtime-config http://127.0.0.1:4176/cp/api/runtime-config
</VirtualHost>
```

---

## 🔧 Variables d'Environnement

### Serveur Node.js (runtime-config-server.js)

```bash
# URLs de base (si différentes de /app et /cp)
export ICONTROL_APP_BASE_URL="/app"
export ICONTROL_CP_BASE_URL="/cp"
export ICONTROL_API_BASE_URL="/api"
export ICONTROL_ASSETS_BASE_URL="/assets"

# Tenant
export ICONTROL_TENANT_ID="production"

# Port et host
export ICONTROL_LOCAL_HOST="127.0.0.1"
export ICONTROL_LOCAL_PORT="4176"
```

### Build Time (Vite)

```bash
# Type d'application (pour build séparé)
export VITE_APP_KIND="CLIENT_APP"  # ou "CONTROL_PLANE"

# Base path (déjà dans --base flag)
npm run build:app -- --base /app/
npm run build:cp -- --base /cp/
```

---

## 🚀 Déploiement

### 1. Build des applications

```bash
cd /chemin/vers/iCONTROL
npm run local:web:build
```

Cela génère:
- `dist/app/` → Application Client
- `dist/cp/` → Application Administration

### 2. Démarrage du serveur runtime-config

```bash
# Option 1: Via npm script
npm run local:web:serve

# Option 2: Directement
node server/runtime-config-server.js \
  --host 127.0.0.1 \
  --port 4176 \
  --dist ./dist
```

### 3. Configuration reverse proxy

Voir configurations nginx/apache ci-dessus.

---

## ✅ Vérification

### Tests de base

```bash
# Application Client
curl -I http://votre-domaine.com/app
# Devrait retourner: 302 → /app/

curl -I http://votre-domaine.com/app/
# Devrait retourner: 200

# Application Administration
curl -I http://votre-domaine.com/cp
# Devrait retourner: 302 → /cp/

curl -I http://votre-domaine.com/cp/
# Devrait retourner: 200

# API Runtime Config
curl http://votre-domaine.com/app/api/runtime-config
# Devrait retourner: JSON avec configuration

curl http://votre-domaine.com/cp/api/runtime-config
# Devrait retourner: JSON avec configuration
```

---

## 🔒 Sécurité

### HTTPS obligatoire en production

```nginx
# Redirection HTTP → HTTPS
server {
    listen 80;
    return 301 https://$server_name$request_uri;
}
```

### Headers de sécurité

```nginx
# Ajouter dans la configuration nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

### CORS (si nécessaire)

```nginx
# Autoriser seulement votre domaine
add_header Access-Control-Allow-Origin "https://votre-domaine.com" always;
add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
```

---

## 🐛 Dépannage

### 404 sur les routes SPA

**Problème:** Les routes internes (ex: `/app/#/dashboard`) retournent 404.

**Solution:** Vérifier que le fallback vers `index.html` est configuré:

```nginx
try_files $uri $uri/ /app/index.html;
```

### Runtime config ne fonctionne pas

**Problème:** `/app/api/runtime-config` retourne 404 ou erreur.

**Solution:** Vérifier que le reverse proxy est configuré correctement et que le serveur Node.js écoute sur le bon port.

### Assets non chargés

**Problème:** Les fichiers JS/CSS ne se chargent pas.

**Solution:** Vérifier les chemins dans `dist/app/assets/` et s'assurer que le serveur web peut les servir.

---

## 📚 Ressources

- [Documentation Nginx](https://nginx.org/en/docs/)
- [Documentation Apache](https://httpd.apache.org/docs/)
- [Vite Base Path](https://vitejs.dev/config/shared-options.html#base)

---

**FIN DU GUIDE**
