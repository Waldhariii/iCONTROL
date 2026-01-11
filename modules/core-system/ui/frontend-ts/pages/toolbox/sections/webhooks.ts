import type { ToolboxSection } from "../contracts";
import { createSectionCard, appendAction } from "../ui";

export const webhooksSection: ToolboxSection = {
  id: "webhooks",
  title: "Webhooks",
  render: (root, ctx) => {
    const card = createSectionCard("Webhooks");
    card.setAttribute("data-toolbox-section", "webhooks");
    const body = card.querySelector(".cxBody") as HTMLElement;

    const p = document.createElement("p");
    p.style.cssText = "opacity:0.85;margin:0 0 8px 0;";
    p.textContent = ctx.safeMode
      ? "SAFE_MODE: simulator only."
      : "Simulator only (V1).";
    body.appendChild(p);

    const pre = document.createElement("pre");
    pre.style.cssText = "white-space:pre-wrap;margin:0;padding:10px;border:1px solid #444;border-radius:10px;";
    pre.textContent = JSON.stringify({ event: "invoice.created", payload: { id: "INV-001", amount: 123.45 } }, null, 2);
    body.appendChild(pre);

    appendAction(body, "Simulate", () => {
      p.textContent = "Simulation queued (stub).";
    }, ctx.safeMode);

    root.appendChild(card);
  }
};
