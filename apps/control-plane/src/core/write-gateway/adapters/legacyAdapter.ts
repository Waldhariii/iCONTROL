import type { WriteAdapter } from "../writeGateway";
import type { WriteCommand, WriteResult } from "../contracts";

export type LegacyApply = (cmd: WriteCommand) => WriteResult;

export function createLegacyAdapter(apply: LegacyApply, name = "legacyAdapter"): WriteAdapter {
  return {
    name,
    apply,
  };
}
