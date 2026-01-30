import type { ToolboxSection } from "../contracts";
import { createSectionCard, appendAction } from "../ui";

export const pipelineSection: ToolboxSection = {
  id: "pipeline",
  title: "Pipeline",
  render: (root, ctx) => {
    const card = createSectionCard("Runtime Pipeline");
    card.setAttribute("data-toolbox-section", "pipeline");
    const body = card.querySelector(".cxBody") as HTMLElement;

    const pre = document.createElement("pre");
    pre.style.cssText = "white-space:pre-wrap;margin:0;padding:10px;border:1px solid var(--ic-border);border-radius:10px;";
    pre.textContent = "Blueprint → compilePlan → RenderPlan → executePlan → safeRender → HTML";
    body.appendChild(pre);

    appendAction(body, "Copy", () => {
      pre.textContent = "Copied (local stub).";
    }, ctx.safeMode);

    root.appendChild(card);
  }
};
