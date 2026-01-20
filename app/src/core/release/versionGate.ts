/**
 * ICONTROL_VERSION_GATE_STUB_V1
 * Stub minimal pour unblock bundling/tests.
 * À remplacer par une implémentation réelle (policy version + compat matrix + hard stop).
 */

export type VersionGateDecision =
  | { ok: true }
  | { ok: false; reason: string; minVersion?: string; currentVersion?: string };

export function checkVersionGate(_opts?: {
  currentVersion?: string;
  minVersion?: string;
}): VersionGateDecision {
  // Stub: always allow
  return { ok: true };
}

export function enforceVersionGate(_decision: VersionGateDecision): void {
  // Stub: no-op (future: throw / route to update modal)
}

// AUTO-STUB export for build unblock
export function checkVersionGateAPI(..._args: any[]): any { return undefined; }
