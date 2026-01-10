import { getRole } from "/src/runtime/rbac";
import { getSafeMode } from "/src/core/studio/internal/policy";
import { renderAccessDenied, safeRender } from "../_shared/mainSystem.shared";
import { mountSections, type SectionSpec } from "../_shared/sections";
import { canAccess } from "./contract";
import { createVerificationModel } from "./model";

export function renderVerification(root: HTMLElement): void {
  const role = getRole();
  const safeMode = getSafeMode();

  if (!canAccess(role, safeMode)) {
    renderAccessDenied(root);
    return;
  }

  const model = createVerificationModel();
  const sections: SectionSpec[] = [
    {
      id: "verification-table",
      title: model.title,
      render: (host) => {
        const wrap = document.createElement("section");
        wrap.setAttribute("style", "max-width:980px;margin:24px auto;padding:0 16px;");

        const h1 = document.createElement("h1");
        h1.setAttribute("style", "margin:0 0 12px 0;");
        h1.textContent = model.title;
        wrap.appendChild(h1);

        const p = document.createElement("p");
        p.setAttribute("style", "opacity:0.7;margin:0 0 16px 0;");
        p.textContent = "Audit trail for verification requests.";
        wrap.appendChild(p);

        const table = document.createElement("table");
        table.setAttribute("style", "width:100%;border-collapse:collapse;");
        const thead = document.createElement("thead");
        const headRow = document.createElement("tr");
        const thId = document.createElement("th");
        thId.setAttribute("style", "text-align:left;padding:8px;border-bottom:1px solid #444;");
        thId.textContent = "ID";
        const thSub = document.createElement("th");
        thSub.setAttribute("style", "text-align:left;padding:8px;border-bottom:1px solid #444;");
        thSub.textContent = "Sujet";
        const thStatus = document.createElement("th");
        thStatus.setAttribute("style", "text-align:left;padding:8px;border-bottom:1px solid #444;");
        thStatus.textContent = "Statut";
        headRow.appendChild(thId);
        headRow.appendChild(thSub);
        headRow.appendChild(thStatus);
        thead.appendChild(headRow);

        const tbody = document.createElement("tbody");
        model.items.forEach((item) => {
          const row = document.createElement("tr");
          const tdId = document.createElement("td");
          tdId.setAttribute("style", "padding:8px;border-bottom:1px solid #2a2a2a;");
          tdId.textContent = item.id;
          const tdSub = document.createElement("td");
          tdSub.setAttribute("style", "padding:8px;border-bottom:1px solid #2a2a2a;");
          tdSub.textContent = item.subject;
          const tdStatus = document.createElement("td");
          tdStatus.setAttribute("style", "padding:8px;border-bottom:1px solid #2a2a2a;");
          tdStatus.textContent = item.status;
          row.appendChild(tdId);
          row.appendChild(tdSub);
          row.appendChild(tdStatus);
          tbody.appendChild(row);
        });

        table.appendChild(thead);
        table.appendChild(tbody);
        wrap.appendChild(table);
        host.appendChild(wrap);
      }
    }
  ];

  safeRender(root, () => {
    root.innerHTML = "";
    mountSections(root, sections, { page: "verification", role, safeMode });
  });
}

export const verificationSections = ["verification-table"];
