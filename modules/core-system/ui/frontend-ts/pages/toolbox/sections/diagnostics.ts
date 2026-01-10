import type { ToolboxSection } from "../contracts";
import { createSectionCard, appendAction } from "../ui";
import { executePlan } from "/src/core/studio/runtime/execute";
import { safeRender } from "/src/core/studio/engine/safe-render";

export const diagnosticsSection: ToolboxSection = {
  id: "diagnostics",
  title: "Diagnostics",
  render: (root, ctx) => {
    const card = createSectionCard("Diagnostics");
    card.setAttribute("data-toolbox-section", "diagnostics");
    const body = card.querySelector(".cxBody") as HTMLElement;

    const plan = {
      ops: [{
        op: "component",
        id: "builtin.table",
        props: {
          title: "",
          columns: ["Signal", "Value"],
          rows: [
            { Signal: "SAFE_MODE", Value: ctx.safeMode ? "ON" : "OFF" },
            { Signal: "Role", Value: ctx.role },
            { Signal: "User", Value: ctx.username },
            { Signal: "Contract", Value: "RenderPlan SSOT" }
          ],
          emptyText: "(empty)"
        }
      }]
    };

    const exec = executePlan(plan as any);
    if (!exec.ok) throw new Error("EXECUTE_PLAN_FAILED");
    const verdict = safeRender(exec.value);
    if (!verdict.ok) throw new Error("SAFE_RENDER_BLOCKED");
    body.innerHTML = verdict.html;

    appendAction(body, "Refresh", () => {
      body.innerHTML = verdict.html;
    }, ctx.safeMode);

    root.appendChild(card);
  }
};
