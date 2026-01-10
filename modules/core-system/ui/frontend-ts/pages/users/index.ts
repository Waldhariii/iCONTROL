import { getRole } from "/src/runtime/rbac";
import { getSafeMode } from "/src/core/studio/internal/policy";
import { canAccess } from "./contract";
import { createUsersModel } from "./model";
import { renderUsersView } from "./view";

export function renderUsers(root: HTMLElement): void {
  const role = getRole();
  const safeMode = getSafeMode();

  if (!canAccess(role, safeMode)) {
    root.innerHTML = "<div style=\"opacity:.8;max-width:780px;margin:24px auto;\">Access denied.</div>";
    return;
  }

  renderUsersView(root, createUsersModel());
}
