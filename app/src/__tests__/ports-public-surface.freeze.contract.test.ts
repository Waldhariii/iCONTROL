import { describe, it, expect } from "vitest";

// IMPORTANT: this imports the SSOT barrel and freezes its public surface.
// Any new export is allowed, but must be made explicit here (update EXPECTED).
import * as Ports from "../core/ports";

function stableKeys(obj: Record<string, unknown>): string[] {
  return Object.keys(obj).filter((k) => k !== "default").sort();
}

/**
 * Governance intent:
 * - The ports barrel is an API boundary. We freeze its public export set so
 *   consumers (CP runtime, tests, adapters) can depend on a stable contract.
 * - Adding/removing/renaming ports MUST be deliberate:
 *   - update EXPECTED list
 *   - add RFC entry (core-lts-freeze)
 */
describe("Governance: Ports public surface freeze (v1)", () => {
  it("exports are stable + explicit", () => {
    const keys = stableKeys(Ports as unknown as Record<string, unknown>);

    // If this fails, copy the printed list into EXPECTED (sorted),
    // then add an RFC entry explaining the change.
    const EXPECTED: string[] = [
      // NOTE: auto-filled once, then manually curated.
      // If empty on first run, paste from console output.
    ];

    if (EXPECTED.length === 0) {
      // High-signal failure mode: prints keys for quick paste.
      throw new Error(
        "EXPECTED ports exports list is empty. Paste this list into EXPECTED (sorted):\n" +
          keys.map((k) => `- ${k}`).join("\n")
      );
    }

    expect(keys).toEqual(EXPECTED);
  });
});
