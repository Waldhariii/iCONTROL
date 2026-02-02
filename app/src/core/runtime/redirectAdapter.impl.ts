import type { RedirectAdapter, RedirectTarget } from "../ports/redirect.adapter";

/**
 * Policy-safe redirect implementation.
 * Rule: no direct window.location.hash writes (governance).
 * - For same-surface navigation, we assign full href with hash fragment.
 * - For cross-surface (CP/APP) we assign the canonical prefixed path.
 */
function targetToHref(t: RedirectTarget): string {
  if (t.kind === "blocked") {
    // same-surface blocked route (hash-based router)
    return `${window.location.origin}${window.location.pathname}#/blocked`;
  }
  // dashboard cross-app targets are canonical
  return t.appKind === "CP"
    ? `${window.location.origin}/cp/#/dashboard`
    : `${window.location.origin}/app/#/dashboard`;
}

export function createRedirectAdapter(): RedirectAdapter {
  return {
    redirect(target) {
      try {
        const href = targetToHref(target);
        if (String(window.location.href) === href) return;
        window.location.assign(href);
      } catch {
        // fail-soft: do nothing
      }
    },
  };
}
