import presentation from "./blueprint.presentation.json";
import structure from "./blueprint.structure.json";
import schemaPresentation from "./schemas/presentation.schema.json";
import schemaStructure from "./schemas/structure.schema.json";

import type { BlueprintKind } from "./types";

export function loadBlueprint(kind: BlueprintKind): unknown {
  return kind === "presentation" ? (presentation as unknown) : (structure as unknown);
}

export function loadSchema(kind: BlueprintKind): unknown {
  return kind === "presentation" ? (schemaPresentation as unknown) : (schemaStructure as unknown);
}
