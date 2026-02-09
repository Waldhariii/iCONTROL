import type { BlueprintDoc } from "./types";

/**
 * Type PageDefinition depuis POC (table page_definitions)
 */
export interface PageDefinition {
  id: string;
  app_kind: 'APP' | 'CP';
  route: string;
  title: string;
  version: string;
  layout: {
    type: string;
    sections: Array<{
      id: string;
      height?: string;
      grid?: { columns: number; gap: string };
      widgets: string[];
    }>;
  };
  widgets: Array<{
    id: string;
    type: string;
    version: string;
    position: any;
    props: Record<string, any>;
  }>;
  dataSources: any[];
  permissions: {
    requiredCapabilities: string[];
  };
}

/**
 * Convertit PageDefinition (POC) vers BlueprintDoc (LEGACY)
 */
export function pageDefinitionToBlueprint(
  pageDef: PageDefinition
): BlueprintDoc {
  return {
    meta: {
      kind: pageDef.layout.type === "dashboard" ? "presentation" : "structure",
      version: parseInt(pageDef.version.split('.')[0] || '1'),
      name: pageDef.title
    },
    data: {
      id: pageDef.id,
      route: pageDef.route,
      title: pageDef.title,
      layout: pageDef.layout,
      widgets: pageDef.widgets,
      dataSources: pageDef.dataSources,
      permissions: pageDef.permissions,
      // Métadonnées additionnelles
      app_kind: pageDef.app_kind,
      version: pageDef.version
    }
  };
}

/**
 * Convertit BlueprintDoc (LEGACY) vers PageDefinition (POC)
 */
export function blueprintToPageDefinition(
  blueprint: BlueprintDoc
): PageDefinition {
  const data = blueprint.data as any;
  
  return {
    id: data.id || 'unknown',
    app_kind: data.app_kind || 'APP',
    route: data.route || '/',
    title: data.title || blueprint.meta.name || 'Untitled',
    version: data.version || '1.0.0',
    layout: data.layout || { type: 'dashboard', sections: [] },
    widgets: data.widgets || [],
    dataSources: data.dataSources || [],
    permissions: data.permissions || { requiredCapabilities: [] }
  };
}
