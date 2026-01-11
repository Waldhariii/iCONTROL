export type BlueprintKind = "presentation" | "structure";

/**
 * Minimal contract. Keep this narrow; evolve via additive fields.
 */
export type BlueprintMeta = {
  kind: BlueprintKind;
  version: number;
  name?: string;
};

export type BlueprintDoc = {
  meta: BlueprintMeta;
  // Free-form payload (validated by schema when available)
  data: unknown;
};
