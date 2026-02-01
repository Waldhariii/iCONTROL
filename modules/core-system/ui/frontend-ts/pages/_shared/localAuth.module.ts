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

let _session: LocalSession | null = null;

export function setSession(s: LocalSession) {
  _session = { ...s };
}

export function clearSession() {
  _session = null;
}

export function getSession(): LocalSession | null {
  return _session ? { ..._session } : null;
}

// Minimal helpers used by some modules (optional)
export function isAuthed(): boolean {
  return !!_session;
}
