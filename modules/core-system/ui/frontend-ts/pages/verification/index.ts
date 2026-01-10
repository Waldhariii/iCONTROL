import { getRole } from "/src/runtime/rbac";
import { getSafeMode } from "/src/core/studio/internal/policy";
import { safeRender as safeHtml } from "/src/core/studio/engine/safe-render";
import { executePlan } from "/src/core/studio/runtime/execute";
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

        const columns = ["ID", "Sujet", "Statut"];
        const rows = model.items.map((item) => ({
          ID: item.id,
          Sujet: item.subject,
          Statut: item.status
        }));

        const plan = {
          ops: [{
            op: "component",
            id: "builtin.table",
            props: {
              title: "",
              columns,
              rows,
              emptyText: "(aucune ligne)"
            }
          }]
        };

        const exec = executePlan(plan as any);
        if (!exec.ok) throw new Error("EXECUTE_PLAN_FAILED");
        const verdict = safeHtml(exec.value);
        if (!verdict.ok) throw new Error("SAFE_RENDER_BLOCKED");

        const tableHost = document.createElement("div");
        tableHost.innerHTML = verdict.html;
        wrap.appendChild(tableHost);
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
