/**
 * Stable manifest view for deterministic fingerprint (strip noise fields).
 */
import { canonicalize, sha256 } from "../../core/contracts/schema/canonical-json.mjs";

const NOISE_KEYS = new Set([
  "generated_at",
  "updated_at",
  "ts",
  "correlation_id",
  "report_path",
  "path",
  "report",
  "evidence",
  "signature",
  "meta"
]);

function stripNoiseDeep(value) {
  if (Array.isArray(value)) return value.map(stripNoiseDeep);
  if (value && typeof value === "object") {
    const out = {};
    for (const k of Object.keys(value)) {
      if (NOISE_KEYS.has(k)) continue;
      out[k] = stripNoiseDeep(value[k]);
    }
    return out;
  }
  return value;
}

/** Returns a copy of manifest with noise fields removed for fingerprinting. */
export function stableManifestView(manifest) {
  const view = stripNoiseDeep(manifest);
  if (view && view.checksums && typeof view.checksums === "object") view.checksums.manifest = "";
  return view;
}

/** Hex sha256 fingerprint of stable view (canonical JSON). */
export function manifestFingerprint(manifest) {
  const stable = stableManifestView(manifest);
  return sha256(canonicalize(stable));
}
