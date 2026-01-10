import { getRole } from "/src/runtime/rbac";
import { getSafeMode } from "/src/core/studio/internal/policy";
import { renderAccessDenied, safeRender } from "../_shared/mainSystem.shared";
import { canAccess } from "./contract";
import { createAccountModel } from "./model";
import { renderAccountView } from "./view";

export function renderAccount(root: HTMLElement): void {
  const role = getRole();
  const safeMode = getSafeMode();

  if (!canAccess(role, safeMode)) {
    renderAccessDenied(root);
    return;
  }

  safeRender(root, () => {
    renderAccountView(root, createAccountModel());
  });
}
