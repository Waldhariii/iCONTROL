import type { BlueprintKind, BlueprintDoc } from "./types";

// LEGACY: Fallback static blueprints (dev/offline mode)
import presentationStatic from "./blueprint.presentation.json";
import structureStatic from "./blueprint.structure.json";
import schemaPresentation from "./schemas/presentation.schema.json";
import schemaStructure from "./schemas/structure.schema.json";

/**
 * HYBRID LOADER
 * Charge depuis DB si disponible, sinon fallback sur fichiers statiques
 */

const API_BASE = typeof window !== 'undefined' 
  ? window.location.origin 
  : 'http://localhost:3001';

/**
 * Charge un blueprint depuis la DB (page_definitions)
 * 
 * @param pageId - ID de la page (ex: "page_clients")
 * @param tenantId - ID du tenant
 * @returns BlueprintDoc depuis DB ou fallback statique
 */
export async function loadBlueprintFromDB(
  pageId: string,
  tenantId: string
): Promise<BlueprintDoc | null> {
  try {
    const response = await fetch(
      `${API_BASE}/api/pages/${pageId}?tenantId=${tenantId}`
    );
    
    if (!response.ok) {
      console.warn(`Blueprint ${pageId} not found in DB, using fallback`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.success || !data.data) {
      return null;
    }
    
    // Mapper page_definition vers BlueprintDoc
    const pageDef = data.data;
    const definition = typeof pageDef.definition === 'string'
      ? JSON.parse(pageDef.definition)
      : pageDef.definition;
    
    // Convertir PageDefinition vers BlueprintDoc
    const blueprint: BlueprintDoc = {
      meta: {
        kind: "presentation", // ou déterminer depuis definition.layout.type
        version: parseInt(definition.version?.split('.')[0] || '1'),
        name: definition.title
      },
      data: definition
    };
    
    return blueprint;
  } catch (error) {
    console.error(`Failed to load blueprint ${pageId}:`, error);
    return null;
  }
}

/**
 * LEGACY: Load static blueprint (fallback)
 */
export function loadBlueprint(kind: BlueprintKind): unknown {
  return kind === "presentation" 
    ? (presentationStatic as unknown) 
    : (structureStatic as unknown);
}

/**
 * LEGACY: Load schema (unchanged)
 */
export function loadSchema(kind: BlueprintKind): unknown {
  return kind === "presentation" 
    ? (schemaPresentation as unknown) 
    : (schemaStructure as unknown);
}

/**
 * HYBRID: Load blueprint (DB first, fallback static)
 */
export async function loadBlueprintHybrid(
  kind: BlueprintKind,
  pageId?: string,
  tenantId?: string
): Promise<unknown> {
  // Si pageId fourni, essayer DB d'abord
  if (pageId && tenantId) {
    const dbBlueprint = await loadBlueprintFromDB(pageId, tenantId);
    if (dbBlueprint) {
      return dbBlueprint;
    }
  }
  
  // Fallback sur fichiers statiques
  return loadBlueprint(kind);
}
