#!/bin/bash
# Script de backup et nettoyage de _RELEASES et anciens _REPORTS

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BACKUP_ROOT="/Users/danygaudreault/System_Innovex"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_ROOT}/backup_${TIMESTAMP}"

echo "=== BACKUP ET NETTOYAGE DE _RELEASES ET _REPORTS ==="
echo ""

# Créer le dossier de backup
mkdir -p "$BACKUP_DIR"
echo "Dossier de backup créé: $BACKUP_DIR"
echo ""

# 1. Sauvegarder et supprimer _RELEASES (artefacts de build)
if [ -d "${ROOT}/_RELEASES" ]; then
  echo "📦 Sauvegarde: _RELEASES/"
  cp -r "${ROOT}/_RELEASES" "$BACKUP_DIR/" 2>/dev/null || {
    echo "  ⚠️  Erreur lors de la copie, tentative avec tar..."
    tar -czf "${BACKUP_DIR}/_RELEASES.tar.gz" -C "$ROOT" "_RELEASES" 2>/dev/null || {
      echo "  ❌ Impossible de sauvegarder _RELEASES"
      exit 1
    }
  }
  
  echo "🗑️  Suppression: _RELEASES/"
  rm -rf "${ROOT}/_RELEASES"
  echo "  ✅ _RELEASES sauvegardé et supprimé"
  echo ""
else
  echo "⏭️  _RELEASES n'existe pas, ignoré"
  echo ""
fi

# 2. Nettoyer _REPORTS (garder le dossier, supprimer les anciens rapports)
if [ -d "${ROOT}/_REPORTS" ]; then
  echo "📦 Sauvegarde des anciens rapports de _REPORTS..."
  REPORT_BACKUP="${BACKUP_DIR}/_REPORTS_archive"
  mkdir -p "$REPORT_BACKUP"
  
  # Compter les fichiers de rapports
  REPORT_COUNT=$(find "${ROOT}/_REPORTS" -type f -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
  
  echo "  📊 Total de rapports trouvés: $REPORT_COUNT"
  
  if [ "$REPORT_COUNT" -gt 10 ]; then
    # Trier par date de modification et garder les 10 plus récents
    find "${ROOT}/_REPORTS" -type f -name "*.md" -exec stat -f '%m %N' {} \; 2>/dev/null | \
      sort -rn | \
      tail -n +11 | \
      cut -d' ' -f2- | \
      while read -r old_report; do
        if [ -f "$old_report" ]; then
          # Préserver la structure de dossiers
          rel_path="${old_report#${ROOT}/_REPORTS/}"
          backup_path="${REPORT_BACKUP}/${rel_path}"
          mkdir -p "$(dirname "$backup_path")"
          cp "$old_report" "$backup_path" 2>/dev/null || true
          rm -f "$old_report"
        fi
      done
    
    # Sauvegarder aussi les dossiers de backup (_BK_*, _BACKUPS_*)
    find "${ROOT}/_REPORTS" -type d \( -name "_BK_*" -o -name "_BACKUPS_*" \) 2>/dev/null | \
      while read -r backup_dir; do
        if [ -d "$backup_dir" ]; then
          rel_path="${backup_dir#${ROOT}/_REPORTS/}"
          backup_path="${REPORT_BACKUP}/${rel_path}"
          mkdir -p "$(dirname "$backup_path")"
          cp -r "$backup_dir" "$backup_path" 2>/dev/null || true
          rm -rf "$backup_dir"
        fi
      done
    
    echo "  ✅ Anciens rapports sauvegardés (gardé les 10 plus récents dans le projet)"
  else
    echo "  ⏭️  Moins de 10 rapports, rien à nettoyer"
  fi
  
  # Garder INDEX.md et .gitkeep s'ils existent
  if [ -f "${ROOT}/_REPORTS/INDEX.md" ]; then
    echo "  ✅ INDEX.md conservé"
  fi
  if [ -f "${ROOT}/_REPORTS/.gitkeep" ]; then
    echo "  ✅ .gitkeep conservé"
  fi
  
  echo ""
else
  echo "⏭️  _REPORTS n'existe pas, ignoré"
  echo ""
fi

# 3. Note sur test_app.zsh (GARDÉ - il est utilisé)
echo "ℹ️  test_app.zsh est GARDÉ (utilisé par CONTRIBUTING.md et docs/release/README.md)"
echo "   C'est un wrapper vers scripts/dev/test_app.zsh"
echo ""

# Créer un fichier README dans le backup
cat > "${BACKUP_DIR}/README.md" << EOF
# Backup iCONTROL - ${TIMESTAMP}

Ce dossier contient une sauvegarde des fichiers inutiles à court/moyen terme qui ont été supprimés du projet iCONTROL.

## Contenu du backup

- \`_RELEASES/\` - Artefacts de build (releases candidates avec dist/, scripts/, etc.)
- \`_REPORTS_archive/\` - Anciens rapports d'audit et dossiers de backup (gardé les 10 plus récents dans le projet)

## Fichiers conservés dans le projet

- \`test_app.zsh\` - **GARDÉ** (wrapper utilisé par la documentation)
- \`_REPORTS/\` - **GARDÉ** (dossier conservé, seulement les 10 plus récents rapports gardés)

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
