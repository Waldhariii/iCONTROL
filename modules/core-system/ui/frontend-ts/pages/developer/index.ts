import { getRole } from "/src/runtime/rbac";
import { getSafeMode } from "/src/core/studio/internal/policy";
import { renderAccessDenied, safeRender } from "../_shared/mainSystem.shared";
import { mountSections, type SectionSpec } from "../_shared/sections";
import { canAccess } from "./contract";
import { createDeveloperModel } from "./model";

export function renderDeveloper(root: HTMLElement): void {
  const role = getRole();
  const safeMode = getSafeMode();

  if (!canAccess(role, safeMode)) {
    renderAccessDenied(root);
    return;
  }

  const model = createDeveloperModel();
  const sections: SectionSpec[] = [
    {
      id: "developer-notes",
      title: model.title,
      render: (host) => {
        const wrap = document.createElement("section");
        const h2 = document.createElement("h2");
        h2.textContent = model.title;
        wrap.appendChild(h2);

        const list = document.createElement("ul");
        model.notes.forEach((note) => {
          const li = document.createElement("li");
          li.textContent = note;
          list.appendChild(li);
        });
        wrap.appendChild(list);
        host.appendChild(wrap);
      }
    }
  ];

  safeRender(root, () => {
    root.innerHTML = "";
    mountSections(root, sections, { page: "developer", role, safeMode });
  });
}

export const developerSections = ["developer-notes"];
