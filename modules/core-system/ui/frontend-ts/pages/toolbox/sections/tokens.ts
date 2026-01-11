import type { ToolboxSection } from "../contracts";
import { createSectionCard, appendAction } from "../ui";

export const tokensSection: ToolboxSection = {
  id: "tokens",
  title: "Tokens & Keys",
  render: (root, ctx) => {
    const card = createSectionCard("Tokens & Keys");
    card.setAttribute("data-toolbox-section", "tokens");
    const body = card.querySelector(".cxBody") as HTMLElement;

    const p = document.createElement("p");
    p.style.cssText = "opacity:0.85;margin:0 0 8px 0;";
    p.textContent = ctx.safeMode
      ? "SAFE_MODE: key operations disabled."
      : "Governed gateway only (V2).";
    body.appendChild(p);

    const pre = document.createElement("pre");
    pre.style.cssText = "white-space:pre-wrap;margin:0;padding:10px;border:1px solid #444;border-radius:10px;";
    pre.textContent = "Policy: no keys are rendered or copied in V1.";
    body.appendChild(pre);

    appendAction(body, "Request Access", () => {
      p.textContent = "Request logged (stub).";
    }, ctx.safeMode);

    root.appendChild(card);
  }
};
