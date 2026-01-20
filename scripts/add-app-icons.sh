#!/usr/bin/env bash
# ICONTROL_ADD_APP_ICONS_V1
# Ajoute des icônes aux applications macOS (si vous avez des fichiers .icns)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DESKTOP_DIR="$HOME/Desktop"
APP_CLIENT_DIR="$DESKTOP_DIR/iCONTROL Client.app"
APP_ADMIN_DIR="$DESKTOP_DIR/iCONTROL Administration.app"

ICON_CLIENT="$1"
ICON_ADMIN="$2"

if [ -z "$ICON_CLIENT" ] || [ -z "$ICON_ADMIN" ]; then
    echo "Usage: $0 <chemin-icone-client.icns> <chemin-icone-admin.icns>"
    echo ""
    echo "Exemple:"
    echo "  $0 ~/Downloads/client.icns ~/Downloads/admin.icns"
    exit 1
fi

if [ ! -f "$ICON_CLIENT" ]; then
    echo "❌ Fichier introuvable: $ICON_CLIENT"
    exit 1
fi

if [ ! -f "$ICON_ADMIN" ]; then
    echo "❌ Fichier introuvable: $ICON_ADMIN"
    exit 1
fi

# Copier les icônes
echo "Ajout des icônes..."
cp "$ICON_CLIENT" "$APP_CLIENT_DIR/Contents/Resources/app.icns"
cp "$ICON_ADMIN" "$APP_ADMIN_DIR/Contents/Resources/app.icns"

# Mettre à jour Info.plist avec Python
echo "Mise à jour Info.plist..."

python3 << 'PYTHON'
import plistlib
import os

# Client
plist_path = os.path.expanduser("~/Desktop/iCONTROL Client.app/Contents/Info.plist")
if os.path.exists(plist_path):
    with open(plist_path, 'rb') as f:
        plist = plistlib.load(f)
    plist['CFBundleIconFile'] = 'app'
    with open(plist_path, 'wb') as f:
        plistlib.dump(plist, f)
    print("✅ Client Info.plist mis à jour")

# Admin
plist_path = os.path.expanduser("~/Desktop/iCONTROL Administration.app/Contents/Info.plist")
if os.path.exists(plist_path):
    with open(plist_path, 'rb') as f:
        plist = plistlib.load(f)
    plist['CFBundleIconFile'] = 'app'
    with open(plist_path, 'wb') as f:
        plistlib.dump(plist, f)
    print("✅ Administration Info.plist mis à jour")
PYTHON

# Actualiser le cache macOS
touch "$APP_CLIENT_DIR"
touch "$APP_ADMIN_DIR"

echo ""
echo "✅ Icônes ajoutées!"
echo "💡 Si les icônes n'apparaissent pas immédiatement:"
echo "   1. Redémarrez le Finder: killall Finder"
echo "   2. Ou redémarrez votre Mac"
