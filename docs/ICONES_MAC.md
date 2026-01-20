# 🎨 Guide des Icônes macOS - iCONTROL

**Date:** 2026-01-14

---

## 📋 Vue d'ensemble

Ce guide explique comment créer et ajouter des icônes personnalisées aux applications macOS iCONTROL.

---

## 🚀 Création Rapide des Applications

### Étape 1: Exécuter le Script de Création

```bash
cd /Users/danygaudreault/System_Innovex_CLEAN/iCONTROL
./scripts/create-mac-apps.sh
```

Cela crée 2 applications sur votre bureau:
- **iCONTROL Client.app** → Ouvre `/app/#/login`
- **iCONTROL Administration.app** → Ouvre `/cp/#/login`

---

## 🎨 Ajouter des Icônes Personnalisées

### Option 1: Utiliser des Icônes Système (Simple)

Si vous avez des images PNG (1024x1024), vous pouvez créer des icônes `.icns`:

```bash
# Créer un dossier temporaire
mkdir -p /tmp/icon.iconset

# Créer les différentes tailles (si vous avez une image 1024x1024)
sips -z 16 16     votre-image.png --out /tmp/icon.iconset/icon_16x16.png
sips -z 32 32     votre-image.png --out /tmp/icon.iconset/icon_16x16@2x.png
sips -z 32 32     votre-image.png --out /tmp/icon.iconset/icon_32x32.png
sips -z 64 64     votre-image.png --out /tmp/icon.iconset/icon_32x32@2x.png
sips -z 128 128   votre-image.png --out /tmp/icon.iconset/icon_128x128.png
sips -z 256 256   votre-image.png --out /tmp/icon.iconset/icon_128x128@2x.png
sips -z 256 256   votre-image.png --out /tmp/icon.iconset/icon_256x256.png
sips -z 512 512   votre-image.png --out /tmp/icon.iconset/icon_256x256@2x.png
sips -z 512 512   votre-image.png --out /tmp/icon.iconset/icon_512x512.png
sips -z 1024 1024 votre-image.png --out /tmp/icon.iconset/icon_512x512@2x.png

# Créer le fichier .icns
iconutil -c icns /tmp/icon.iconset -o ~/Desktop/iCONTROL-Client.icns

# Copier l'icône dans l'application
cp ~/Desktop/iCONTROL-Client.icns ~/Desktop/iCONTROL\ Client.app/Contents/Resources/app.icns
```

### Option 2: Utiliser un Outil Graphique

1. **Icône Generator** (App Store)
   - Importez votre image
   - Exportez en .icns

2. **Image2icon** (Gratuit)
   - Glissez votre image
   - Exportez .icns

3. **Online** (https://cloudconvert.com/png-to-icns)
   - Uploadez votre PNG
   - Téléchargez le .icns

---

## 📝 Mettre à Jour les Applications avec les Icônes

### Étape 1: Placer les Icônes

```bash
# Client
cp votre-client.icns ~/Desktop/iCONTROL\ Client.app/Contents/Resources/app.icns

# Administration
cp votre-admin.icns ~/Desktop/iCONTROL\ Administration.app/Contents/Resources/app.icns
```

### Étape 2: Mettre à Jour Info.plist

Pour chaque application, éditez `Info.plist` et ajoutez:

```xml
<key>CFBundleIconFile</key>
<string>app</string>
```

**Client:**
```bash
# Ouvrir avec un éditeur
open -a "TextEdit" ~/Desktop/iCONTROL\ Client.app/Contents/Info.plist
```

**Administration:**
```bash
open -a "TextEdit" ~/Desktop/iCONTROL\ Administration.app/Contents/Info.plist
```

Ajoutez les lignes dans la section `<dict>`, par exemple:

```xml
<dict>
    ...
    <key>CFBundleIconFile</key>
    <string>app</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
```

### Étape 3: Actualiser le Cache macOS

```bash
# Actualiser le cache des icônes
touch ~/Desktop/iCONTROL\ Client.app
touch ~/Desktop/iCONTROL\ Administration.app

# Ou redémarrer le Finder
killall Finder
```

---

## 🔧 Script Automatique (Avancé)

Créez un script `scripts/add-icons.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

ICON_CLIENT="$1"  # Chemin vers icône client
ICON_ADMIN="$2"   # Chemin vers icône admin

# Client
cp "$ICON_CLIENT" ~/Desktop/iCONTROL\ Client.app/Contents/Resources/app.icns

# Admin
cp "$ICON_ADMIN" ~/Desktop/iCONTROL\ Administration.app/Contents/Resources/app.icns

# Mettre à jour Info.plist (avec Python ou sed)
python3 << 'PYTHON'
import plistlib
import os

# Client
plist_path = os.path.expanduser("~/Desktop/iCONTROL Client.app/Contents/Info.plist")
with open(plist_path, 'rb') as f:
    plist = plistlib.load(f)
plist['CFBundleIconFile'] = 'app'
with open(plist_path, 'wb') as f:
    plistlib.dump(plist, f)

# Admin
plist_path = os.path.expanduser("~/Desktop/iCONTROL Administration.app/Contents/Info.plist")
with open(plist_path, 'rb') as f:
    plist = plistlib.load(f)
plist['CFBundleIconFile'] = 'app'
with open(plist_path, 'wb') as f:
    plistlib.dump(plist, f)
PYTHON

# Actualiser
touch ~/Desktop/iCONTROL\ Client.app
touch ~/Desktop/iCONTROL\ Administration.app

echo "✅ Icônes ajoutées!"
```

Usage:
```bash
./scripts/add-icons.sh client.icns admin.icns
```

---

## 🎯 Icônes Suggérées

### Design Suggestions

**Client (APP):**
- Couleur: Bleu/Vert (amical, utilisateur)
- Symbole: Utilisateur, maison, ou logo application
- Style: Moderne, arrondi

**Administration (CP):**
- Couleur: Violet/Rouge (professionnel, contrôle)
- Symbole: Outils, engrenage, bouclier
- Style: Pro, carré

---

## ✅ Vérification

1. Les icônes apparaissent sur le bureau
2. Double-clic ouvre le navigateur
3. Le serveur démarre automatiquement si nécessaire
4. La bonne application s'ouvre (`/app` ou `/cp`)

---

## 🐛 Dépannage

### Les icônes ne s'affichent pas

```bash
# 1. Vérifier que les fichiers existent
ls -la ~/Desktop/iCONTROL\ Client.app/Contents/Resources/

# 2. Vérifier Info.plist
cat ~/Desktop/iCONTROL\ Client.app/Contents/Info.plist | grep -A 1 CFBundleIconFile

# 3. Actualiser le cache
killall Finder
touch ~/Desktop/iCONTROL\ Client.app
```

### Les applications ne s'ouvrent pas

```bash
# Vérifier les permissions
chmod +x ~/Desktop/iCONTROL\ Client.app/Contents/MacOS/iCONTROL\ Client
chmod +x ~/Desktop/iCONTROL\ Administration.app/Contents/MacOS/iCONTROL\ Administration
```

---

**FIN DU GUIDE**
