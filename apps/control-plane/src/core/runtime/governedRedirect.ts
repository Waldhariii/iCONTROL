/**
 * Governed Redirect — v2 (compliant)
 * - No direct window.location.hash writes.
 * - Delegates to RedirectAdapter implementation.
 */
import type { RedirectTarget } from "../ports/redirect.adapter";
import { createRedirectAdapter } from "./redirectAdapter.impl";

let _adapter = createRedirectAdapter();

export function _setRedirectAdapterForTests(next: ReturnType<typeof createRedirectAdapter>): void {
  _adapter = next;
}

export function governedRedirect(target: RedirectTarget): void {
  _adapter.redirect(target);
}
