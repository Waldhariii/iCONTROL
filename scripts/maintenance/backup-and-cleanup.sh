#!/bin/bash
# Script de backup et nettoyage des fichiers inutiles à court/moyen terme

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BACKUP_ROOT="/Users/danygaudreault/System_Innovex"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_ROOT}/backup_${TIMESTAMP}"

echo "=== BACKUP ET NETTOYAGE DES FICHIERS INUTILES ==="
echo ""

# Créer le dossier de backup
mkdir -p "$BACKUP_DIR"
echo "Dossier de backup créé: $BACKUP_DIR"
echo ""

# Liste des dossiers/fichiers à sauvegarder et supprimer
ITEMS_TO_BACKUP=(
  "_INTAKE"
  "_DATA"
  "iCONTROL"
  "icontrol-perfect"
  "migration"
)

# Fonction pour sauvegarder et supprimer
backup_and_remove() {
  local item="$1"
  local item_path="${ROOT}/${item}"
  
  if [ -e "$item_path" ]; then
    echo "📦 Sauvegarde: $item"
    cp -r "$item_path" "$BACKUP_DIR/" 2>/dev/null || {
      echo "  ⚠️  Erreur lors de la copie, tentative avec tar..."
      tar -czf "${BACKUP_DIR}/${item}.tar.gz" -C "$ROOT" "$item" 2>/dev/null || {
        echo "  ❌ Impossible de sauvegarder $item"
        return 1
      }
    }
    
    echo "🗑️  Suppression: $item"
    rm -rf "$item_path"
    echo "  ✅ $item sauvegardé et supprimé"
    echo ""
  else
    echo "⏭️  $item n'existe pas, ignoré"
    echo ""
  fi
}

# Sauvegarder et supprimer chaque item
for item in "${ITEMS_TO_BACKUP[@]}"; do
  backup_and_remove "$item"
done

# Sauvegarder aussi les rapports anciens (garder seulement les 10 plus récents)
if [ -d "${ROOT}/_REPORTS" ]; then
  echo "📦 Sauvegarde des rapports anciens..."
  REPORT_BACKUP="${BACKUP_DIR}/_REPORTS_old"
  mkdir -p "$REPORT_BACKUP"
  
  # Compter les fichiers de rapports
  REPORT_COUNT=$(find "${ROOT}/_REPORTS" -type f -name "*.md" | wc -l | tr -d ' ')
  
  if [ "$REPORT_COUNT" -gt 10 ]; then
    # Trier par date de modification et garder les 10 plus récents (macOS compatible)
    find "${ROOT}/_REPORTS" -type f -name "*.md" -exec stat -f '%m %N' {} \; | \
      sort -rn | \
      tail -n +11 | \
      cut -d' ' -f2- | \
      while read -r old_report; do
        if [ -f "$old_report" ]; then
          cp "$old_report" "$REPORT_BACKUP/" 2>/dev/null || true
          rm -f "$old_report"
        fi
      done
    echo "  ✅ Rapports anciens sauvegardés (gardé les 10 plus récents)"
  else
    echo "  ⏭️  Moins de 10 rapports, rien à nettoyer"
  fi
  echo ""
fi

# Créer un fichier README dans le backup
cat > "${BACKUP_DIR}/README.md" << EOF
# Backup iCONTROL - ${TIMESTAMP}

Ce dossier contient une sauvegarde des fichiers inutiles à court/moyen terme qui ont été supprimés du projet iCONTROL.

## Contenu du backup

- \`_INTAKE/\` - Dossiers d'intake/archive (données déjà intégrées dans le code)
- \`_DATA/\` - Données de test
- \`iCONTROL/\` - Dossier de travail temporaire
- \`icontrol-perfect/\` - Dossier de travail temporaire
- \`migration/\` - Dossier de migration (vide, migrations terminées)
- \`_REPORTS_old/\` - Anciens rapports (gardé les 10 plus récents dans le projet)

## Date de backup

${TIMESTAMP}

## Emplacement original

${ROOT}

## Note

Ces fichiers peuvent être supprimés définitivement après vérification qu'ils ne sont plus nécessaires.
EOF

echo "=== BACKUP TERMINÉ ==="
echo ""
echo "📁 Dossier de backup: $BACKUP_DIR"
echo "📄 README créé: ${BACKUP_DIR}/README.md"
echo ""
echo "✅ Nettoyage terminé avec succès!"
echo ""
echo "Pour restaurer un fichier:"
echo "  cp -r ${BACKUP_DIR}/<nom_du_dossier> ${ROOT}/"
echo ""
echo "Pour supprimer définitivement le backup:"
echo "  rm -rf ${BACKUP_DIR}"
