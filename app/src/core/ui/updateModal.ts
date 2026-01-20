/**
 * ICONTROL_UPDATE_MODAL_STUB_V1
 * Stub minimal pour unblock bundling/tests.
 * À remplacer par une implémentation réelle (UI + version gate + release notes).
 */

export type UpdateModalOptions = {
  title?: string;
  message?: string;
  currentVersion?: string;
  minVersion?: string;
};

export function showUpdateModal(_opts?: UpdateModalOptions): void {
  // Stub: no-op
}

export function hideUpdateModal(): void {
  // Stub: no-op
}
