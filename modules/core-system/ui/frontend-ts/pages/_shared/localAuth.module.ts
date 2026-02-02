/**
 * Module-local auth shim.
 * Modules must not depend on app/src/localAuth.
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

const LS_SESSION = "icontrol_session_v1";

let _session: LocalSession | null = null;

function syncToStorage(s: LocalSession | null) {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      if (s) window.localStorage.setItem(LS_SESSION, JSON.stringify(s));
      else window.localStorage.removeItem(LS_SESSION);
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
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(LS_SESSION);
      if (raw) {
        _session = JSON.parse(raw) as LocalSession;
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
