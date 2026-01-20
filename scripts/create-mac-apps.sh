#!/usr/bin/env bash
# ICONTROL_CREATE_MAC_APPS_V1
# Crée 2 applications macOS pour le bureau avec icônes

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT"

DESKTOP_DIR="$HOME/Desktop"
APP_CLIENT_DIR="$DESKTOP_DIR/iCONTROL Client.app"
APP_ADMIN_DIR="$DESKTOP_DIR/iCONTROL Administration.app"

# Créer l'application CLIENT
echo "Création de l'application CLIENT..."
rm -rf "$APP_CLIENT_DIR"
mkdir -p "$APP_CLIENT_DIR/Contents/MacOS"
mkdir -p "$APP_CLIENT_DIR/Contents/Resources"

# Copier le script
cp "$SCRIPT_DIR/launch-app-client.sh" "$APP_CLIENT_DIR/Contents/MacOS/iCONTROL Client"

# Créer Info.plist
cat > "$APP_CLIENT_DIR/Contents/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>iCONTROL Client</string>
    <key>CFBundleIdentifier</key>
    <string>com.icontrol.client</string>
    <key>CFBundleName</key>
    <string>iCONTROL Client</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
EOF

chmod +x "$APP_CLIENT_DIR/Contents/MacOS/iCONTROL Client"

# Créer l'application ADMINISTRATION
echo "Création de l'application ADMINISTRATION..."
rm -rf "$APP_ADMIN_DIR"
mkdir -p "$APP_ADMIN_DIR/Contents/MacOS"
mkdir -p "$APP_ADMIN_DIR/Contents/Resources"

# Copier le script
cp "$SCRIPT_DIR/launch-app-admin.sh" "$APP_ADMIN_DIR/Contents/MacOS/iCONTROL Administration"

# Créer Info.plist
cat > "$APP_ADMIN_DIR/Contents/Info.plist" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>iCONTROL Administration</string>
    <key>CFBundleIdentifier</key>
    <string>com.icontrol.admin</string>
    <key>CFBundleName</key>
    <string>iCONTROL Administration</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
EOF

chmod +x "$APP_ADMIN_DIR/Contents/MacOS/iCONTROL Administration"

echo ""
echo "✅ Applications créées sur le bureau:"
echo "   - iCONTROL Client.app"
echo "   - iCONTROL Administration.app"
echo ""
echo "📝 Pour ajouter des icônes personnalisées:"
echo "   1. Créez des fichiers .icns (1024x1024 PNG → icns)"
echo "   2. Placez-les dans:"
echo "      - $APP_CLIENT_DIR/Contents/Resources/app.icns"
echo "      - $APP_ADMIN_DIR/Contents/Resources/app.icns"
echo "   3. Ajoutez dans Info.plist:"
echo "      <key>CFBundleIconFile</key>"
echo "      <string>app</string>"
echo ""
