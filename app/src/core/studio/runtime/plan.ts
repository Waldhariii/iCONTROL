import type { BlueprintDoc } from "../blueprints/types";
import type { RuntimeResult } from "./result";
import { err, ok } from "./result";

export type RenderOp =
  | { op: "text"; value: string }
  | { op: "component"; id: string; props?: Record<string, unknown> };

export type RenderPlan = {
  ops: RenderOp[];
};

export function compilePlan(blueprint: BlueprintDoc): RuntimeResult<RenderPlan> {
  try {
    // Deterministic compile v1; map blueprint->ops later.
    const ops: RenderOp[] = [{ op: "text", value: JSON.stringify(blueprint) }];
    return ok({ ops });
  } catch (e) {
    return err("internal_error", e instanceof Error ? e.message : "unknown");
  }
}
