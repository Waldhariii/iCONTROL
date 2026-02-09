#!/bin/bash
FILE="$1"

if [ ! -f "$FILE" ]; then
  echo "File not found: $FILE"
  exit 1
fi

# Vérifier si déjà présent
if grep -q "useTenantContext\|tenantId" "$FILE"; then
  echo "Already has tenant context: $FILE"
  exit 0
fi

# Ajouter import
if ! grep -q "import.*useTenantContext" "$FILE"; then
  sed -i '' "1a\\
import { useTenantContext } from '@/core/tenant/tenantContext';\\
" "$FILE"
fi

# Ajouter hook dans le composant
sed -i '' '/^export default function.*{$/a\\
  const { tenantId } = useTenantContext();\\
' "$FILE"

echo "✅ Added tenant context to: $FILE"
