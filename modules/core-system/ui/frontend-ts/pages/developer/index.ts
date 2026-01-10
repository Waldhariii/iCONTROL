import { getRole } from "/src/runtime/rbac";
import { getSafeMode } from "/src/core/studio/internal/policy";
import { canAccess } from "./contract";
import { createDeveloperModel } from "./model";
import { renderDeveloperView } from "./view";

export function renderDeveloper(root: HTMLElement): void {
  const role = getRole();
  const safeMode = getSafeMode();

  if (!canAccess(role, safeMode)) {
    root.innerHTML = "<div style=\"opacity:.8;max-width:780px;margin:24px auto;\">Access denied.</div>";
    return;
  }

  renderDeveloperView(root, createDeveloperModel());
}
