// Real surface (P1.2): runtime-smoke
// NOTE: prod-safe, no import-time side effects.
// TODO: replace with the real runtime-smoke implementation (no _legacy).
import * as Legacy from "../../_legacy/runtime-smoke";

export default function RuntimeSmokePage() {
  const C = (Legacy as any).default;
  return C ? <C /> : null;
}
