import type { ToolboxSection } from "../contracts";
import { createSectionCard, appendAction } from "../ui";

function safeNow(): string {
  try { return new Date().toISOString(); } catch { return "unknown"; }
}

export const logsSection: ToolboxSection = {
  id: "logs",
  title: "Tech Logs",
  render: (root, ctx) => {
    const card = createSectionCard("Tech Logs");
    card.setAttribute("data-toolbox-section", "logs");
    const body = card.querySelector(".cxBody") as HTMLElement;

    const pre = document.createElement("pre");
    pre.style.cssText = "white-space:pre-wrap;margin:0;padding:10px;border:1px solid #444;border-radius:10px;";
    pre.textContent = [
      `[${safeNow()}] INFO TOOLBOX_OPENED`,
      `[${safeNow()}] INFO PIPELINE_OK compilePlan->executePlan->safeRender`,
      `[${safeNow()}] WARN REDACTION_ACTIVE`
    ].join("\n");
    body.appendChild(pre);

    appendAction(body, "Rotate", () => {
      pre.textContent = `[${safeNow()}] INFO LOG_ROTATED`;
    }, ctx.safeMode);

    root.appendChild(card);
  }
};
