#!/bin/bash
set -e

PAGE_NAME="$1"
SURFACE="$2" # cp ou app

if [ -z "$PAGE_NAME" ] || [ -z "$SURFACE" ]; then
  echo "Usage: $0 <page-name> <cp|app>"
  exit 1
fi

if [ "$SURFACE" != "cp" ] && [ "$SURFACE" != "app" ]; then
  echo "Error: SURFACE must be 'cp' or 'app'"
  exit 1
fi

PAGE_DIR="app/src/surfaces/$SURFACE/$PAGE_NAME"

if [ -d "$PAGE_DIR" ]; then
  echo "Error: Page already exists: $PAGE_DIR"
  exit 1
fi

mkdir -p "$PAGE_DIR/widgets"

PAGE_PASCAL=$(echo "$PAGE_NAME" | sed -E 's/(^|-)([a-z])/'"\\U"'\2/g')

# Page.tsx
cat > "$PAGE_DIR/Page.tsx" << ENDPAGE
import React from 'react';
import { usePageQueries } from './queries';
import { usePageCommands } from './commands';

export default function ${PAGE_PASCAL}Page() {
  const { data, isLoading } = usePageQueries();
  const { handleAction } = usePageCommands();

  if (isLoading) {
    return <div className="loading-state">Chargement...</div>;
  }

  return (
    <div className="page-container">
      <h1>${PAGE_PASCAL}</h1>
    </div>
  );
}
ENDPAGE

# queries.ts
cat > "$PAGE_DIR/queries.ts" << 'ENDQUERY'
import { useTenantContext } from '@/core/tenant/tenantContext';

export function usePageQueries() {
  const { tenantId } = useTenantContext();

  // TODO: Implémenter queries avec tenant scoping

  return {
    data: null,
    isLoading: false
  };
}
ENDQUERY

# commands.ts
cat > "$PAGE_DIR/commands.ts" << 'ENDCMD'
import { useWriteGateway } from '@/platform/write-gateway/writeGateway';

export function usePageCommands() {
  const writeGateway = useWriteGateway();

  const handleAction = async (payload: any) => {
    await writeGateway.execute({
      type: 'ACTION',
      payload
    });
  };

  return { handleAction };
}
ENDCMD

# model.ts
cat > "$PAGE_DIR/model.ts" << ENDMODEL
export interface ${PAGE_PASCAL}Data {
  id: string;
}
ENDMODEL

touch "$PAGE_DIR/widgets/.gitkeep"

echo "✅ Feature slice created: $PAGE_DIR"
