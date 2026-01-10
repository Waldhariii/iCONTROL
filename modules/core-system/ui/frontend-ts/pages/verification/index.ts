import { getRole } from "/src/runtime/rbac";
import { getSafeMode } from "/src/core/studio/internal/policy";
import { renderAccessDenied, safeRender } from "../_shared/mainSystem.shared";
import { canAccess } from "./contract";
import { createVerificationModel } from "./model";
import { renderVerificationView } from "./view";

export function renderVerification(root: HTMLElement): void {
  const role = getRole();
  const safeMode = getSafeMode();

  if (!canAccess(role, safeMode)) {
    renderAccessDenied(root);
    return;
  }

  safeRender(root, () => {
    renderVerificationView(root, createVerificationModel());
  });
}
