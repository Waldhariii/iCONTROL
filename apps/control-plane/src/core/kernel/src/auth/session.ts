/**
 * Kernel session facade (pressure-layer ready).
 * - No import-time side effects.
 * - Call-time only.
 * - Designed to be wired to commandBus/writeGovernor/tenantQueue later without breaking callsites.
 */
export type SessionRole = "USER" | "ADMIN" | "SYSADMIN" | "DEVELOPER";
export type Session = { username: string; role: SessionRole; issuedAt: number };

let _mem: Session | null = null;

export function setKernelSession(s: Session): void {
  _mem = s;
}

export function clearKernelSession(): void {
  _mem = null;
}

export function getKernelSession(): Session | null {
  return _mem;
}

export function isKernelAuthed(): boolean {
  return !!_mem;
}
