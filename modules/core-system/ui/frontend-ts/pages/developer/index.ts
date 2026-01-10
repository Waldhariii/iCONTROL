import { getRole } from "/src/runtime/rbac";
import { getSafeMode } from "/src/core/studio/internal/policy";
import { renderAccessDenied, safeRender } from "../_shared/mainSystem.shared";
import { canAccess } from "./contract";
import { createDeveloperModel } from "./model";
import { renderDeveloperView } from "./view";

export function renderDeveloper(root: HTMLElement): void {
  const role = getRole();
  const safeMode = getSafeMode();

  if (!canAccess(role, safeMode)) {
    renderAccessDenied(root);
    return;
  }

  safeRender(root, () => {
    renderDeveloperView(root, createDeveloperModel());
  });
}
