/**
 * ICONTROL_KEYBOARD_SHORTCUTS_STUB_V1
 * Stub minimal pour unblock bundling/tests.
 * À remplacer par une implémentation réelle (registry shortcuts + scopes + teardown).
 */

export type Shortcut = {
  id: string;
  combo: string;
  description?: string;
  handler: () => void;
};

export function registerKeyboardShortcuts(_shortcuts: Shortcut[]): () => void {
  // Stub: no-op, return disposer
  return () => {};
}

// AUTO-STUB export for build unblock
export function initKeyboardShortcuts(..._args: any[]): any { return undefined; }
