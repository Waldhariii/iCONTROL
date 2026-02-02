import { describe, it, expect } from "vitest";

/**
 * Governance Freeze — Ports Public Surface
 * - This test is intentionally strict: it freezes what app-layer ports expose.
 * - Update process: modify app/src/core/ports/index.ts intentionally, then update EXPECTED here.
 * - Keep list sorted.
 */
import * as Ports from "../core/ports";

const EXPECTED = [
  "bindSnapshot",
  "bindSnapshotPort",
  "bindVfs",
  "bindVfsPort",
  "getSnapshotPort",
  "getVfsPort",
  "SnapshotCreate",
  "SnapshotList",
  "SnapshotMeta",
  "SnapshotPort",
  "SnapshotRestore",
  "SnapshotResult",
  "VfsDelete",
  "VfsPort",
  "VfsRead",
  "VfsResult",
  "VfsWrite"
] as const;

describe("ports public surface freeze (contract)", () => {
  it("exports list is stable + sorted", () => {
    const actual = Object.keys(Ports).sort((a, b) => a.localeCompare(b));
    // Strong guarantee: exact match
    expect(actual).toEqual([...EXPECTED]);
    // Secondary: EXPECTED must be sorted/deduped (defense-in-depth)
    expect([...EXPECTED]).toEqual([...new Set([...EXPECTED])].sort((a,b)=>a.localeCompare(b)));
  });
});
