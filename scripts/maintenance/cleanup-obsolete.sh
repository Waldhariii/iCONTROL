#!/bin/bash
# Script de nettoyage des fichiers obsolètes et désuets dans iCONTROL

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "=== NETTOYAGE DES FICHIERS OBSOLÈTES ==="
echo ""

# 1. Fichiers de documentation obsolètes (racine)
echo "1. Suppression des fichiers de documentation obsolètes..."
OBSOLETE_DOCS=(
  "_ANALYSE_ET_CORRECTIONS_P1.4.x.md"
  "_ANALYSE_PAGES_PARTAGEES.md"
  "_CORRECTIONS_PAGE_NOIRE.md"
  "_DEBUG_APPLICATIONS.md"
  "_GUIDE_ICONES_BUREAU.md"
  "_LISTE_PAGES_COMPLETE.md"
  "_RAPPORT_CORRECTIONS_FINAL.md"
  "_RESUME_AMELIORATIONS_PAGES.md"
  "_SOLUTION_SERVEUR_BACKGROUND.md"
  "_RELEASE_NOTES_vX.Y.Z.md"
  "_RELEASE_NOTES_v0.2.0-rc1.md"
  "_RELEASE_NOTES_v0.2.0-rc3.md"
  "_RELEASE_NOTES_v0.2.0-tools1.md"
  "_RELEASE_NOTES_v0.2.0-tools2.md"
  "_RELEASE_NOTES_v0.2.0-tools3.md"
  "_RELEASE_NOTES_v0.2.0-tools4.md"
  "_RELEASE_NOTES_v0.2.0-tools5.md"
  "_RELEASE_NOTES_v0.2.0-tools6.md"
  "_RELEASE_NOTES_v0.2.0-tools7.md"
  "_RELEASE_NOTES_v0.2.0-tools8.md"
  "_RELEASE_NOTES_v0.2.0-tools9.md"
  # Garder _RELEASE_NOTES_v0.2.0.md comme référence
)

for file in "${OBSOLETE_DOCS[@]}"; do
  if [ -f "$file" ]; then
    echo "  Suppression: $file"
    rm -f "$file"
  fi
done

# 2. Dossiers de travail temporaires
echo ""
echo "2. Suppression des dossiers de travail temporaires..."
if [ -d "migration" ] && [ -z "$(ls -A migration 2>/dev/null)" ]; then
  echo "  Suppression: migration/ (vide)"
  rmdir migration 2>/dev/null || true
fi

# 3. Fichiers scripts utilitaires obsolètes
echo ""
echo "3. Suppression des scripts utilitaires obsolètes..."
if [ -f "routes_inspect.sh" ]; then
  echo "  Suppression: routes_inspect.sh (script de debug obsolète)"
  rm -f "routes_inspect.sh"
fi

# 4. Documentation de migration obsolète
echo ""
echo "4. Suppression de la documentation de migration obsolète..."
if [ -f "docs/ICONTROL_PAGE_MIGRATION_20260109_212713.md" ]; then
  echo "  Suppression: docs/ICONTROL_PAGE_MIGRATION_20260109_212713.md"
  rm -f "docs/ICONTROL_PAGE_MIGRATION_20260109_212713.md"
fi

if [ -f "docs/ICONTROL_MAIN_SYSTEM_TABLES_MIGRATION_20260110_091609.md" ]; then
  echo "  Suppression: docs/ICONTROL_MAIN_SYSTEM_TABLES_MIGRATION_20260110_091609.md"
  rm -f "docs/ICONTROL_MAIN_SYSTEM_TABLES_MIGRATION_20260110_091609.md"
fi

# 5. Rapports temporaires dans docs/reports
echo ""
echo "5. Nettoyage des rapports temporaires..."
if [ -d "docs/reports" ]; then
  OLD_REPORTS=(
    "ICONTROL_SYSTEM_RECOMMENDATIONS_APPLIED_20260109_174741.md"
    "ICONTROL_MAIN_SYSTEM_RESTORE_20260109_211011.md"
    "ICONTROL_EXISTING_PAGES_WIRING_20260109_200900.md"
    "ICONTROL_SYSTEM_RECOMMENDATIONS_APPLIED_20260109_180546.md"
  )
  for report in "${OLD_REPORTS[@]}"; do
    if [ -f "docs/reports/$report" ]; then
      echo "  Suppression: docs/reports/$report"
      rm -f "docs/reports/$report"
    fi
  done
fi

echo ""
echo "=== NETTOYAGE TERMINÉ ==="
echo ""
echo "Note: Les dossiers suivants sont ignorés par git mais peuvent contenir des fichiers:"
echo "  - _DATA/ (données de test)"
echo "  - _INTAKE/ (fichiers d'intake)"
echo "  - _REPORTS/ (rapports générés)"
echo "  - iCONTROL/ (dossier de travail)"
echo "  - icontrol-perfect/ (dossier de travail)"
echo ""
echo "Pour nettoyer ces dossiers manuellement, utilisez:"
echo "  rm -rf _DATA/ _INTAKE/ iCONTROL/ icontrol-perfect/"
