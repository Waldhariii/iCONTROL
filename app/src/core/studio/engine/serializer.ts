export type StructureBlueprint = {
  version?: number;
  datasources?: Record<string, unknown>;
  tables?: Record<string, unknown>;
  forms?: Record<string, unknown>;
  pages?: Record<string, unknown>;
  rules?: Record<string, unknown>;
};

export function serializeStructure(bp: StructureBlueprint): string {
  return JSON.stringify(bp, null, 2);
}

export function deserializeStructure(text: string): StructureBlueprint {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}
