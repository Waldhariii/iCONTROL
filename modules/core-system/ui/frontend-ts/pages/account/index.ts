import { getRole } from "/src/runtime/rbac";
import { getSafeMode } from "/src/core/studio/internal/policy";
import { renderAccessDenied, safeRender } from "../_shared/mainSystem.shared";
import { mountSections, type SectionSpec } from "../_shared/sections";
import { canAccess } from "./contract";
import { createAccountModel } from "./model";

export function renderAccount(root: HTMLElement): void {
  const role = getRole();
  const safeMode = getSafeMode();

  if (!canAccess(role, safeMode)) {
    renderAccessDenied(root);
    return;
  }

  const model = createAccountModel();
  const sections: SectionSpec[] = [
    {
      id: "account-summary",
      title: model.title,
      render: (host) => {
        const wrap = document.createElement("section");
        const h2 = document.createElement("h2");
        h2.textContent = model.title;
        wrap.appendChild(h2);

        const p = document.createElement("p");
        p.textContent = model.description;
        wrap.appendChild(p);

        host.appendChild(wrap);
      }
    }
  ];

  safeRender(root, () => {
    root.innerHTML = "";
    mountSections(root, sections, { page: "account", role, safeMode });
  });
}

export const accountSections = ["account-summary"];
