// @ts-nocheck
import { webStorage } from "../../../../../../apps/control-plane/src/core/storage/webStorage";

/**
 * Module-local auth shim.
 * Modules must not depend on apps/control-plane/src/localAuth.
 *
 * Purpose:
 * - Provide a stable API for module tests (setSession/clearSession/getSession)
 * - Fail-closed by default in real runtime (no implicit auth)
 */
export type LocalSession = {
  username: string;
  role: string;
  issuedAt: number;
};

const LS_SESSION_APP = "icontrol_session_v1";
const LS_SESSION_CP = "icontrol_mgmt_session_v1";

let _session: LocalSession | null = null;

function syncToStorage(s: LocalSession | null) {
  try {
    if (typeof window !== "undefined") {
      if (s) {
        webStorage.set(LS_SESSION_APP, JSON.stringify(s));
        webStorage.set(LS_SESSION_CP, JSON.stringify(s));
      } else {
        webStorage.del(LS_SESSION_APP);
        webStorage.del(LS_SESSION_CP);
      }
    }
  } catch {
    /* storage disabled */
  }
}

export function setSession(s: LocalSession) {
  _session = { ...s };
  syncToStorage(_session);
}

export function clearSession() {
  _session = null;
  syncToStorage(null);
}

export function getSession(): LocalSession | null {
  if (_session) return { ..._session };
  try {
    if (typeof window !== "undefined") {
      const rawCp = webStorage.get(LS_SESSION_CP);
      if (rawCp) {
        _session = JSON.parse(rawCp) as LocalSession;
        return _session ? { ..._session } : null;
      }
      const rawApp = webStorage.get(LS_SESSION_APP);
      if (rawApp) {
        _session = JSON.parse(rawApp) as LocalSession;
        return _session ? { ..._session } : null;
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

// Minimal helpers used by some modules (optional)
export function isAuthed(): boolean {
  return !!_session;
}
