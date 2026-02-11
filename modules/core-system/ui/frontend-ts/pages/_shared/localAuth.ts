// @ts-nocheck
/**
 * Module-safe localAuth facade.
 * MUST NOT import from apps/control-plane/src.
 * Exposes a stable API for module page tests and UI glue.
 */
export { setSession, clearSession, getSession, isAuthed } from "./localAuth.module";
export type { LocalSession } from "./localAuth.module";
