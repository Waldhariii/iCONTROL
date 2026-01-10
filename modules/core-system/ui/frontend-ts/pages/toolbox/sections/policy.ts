import type { ToolboxSection } from "../contracts";
import { createSectionCard, appendAction } from "../ui";

export const policySection: ToolboxSection = {
  id: "policy",
  title: "Policy",
  render: (root, ctx) => {
    const card = createSectionCard("Policy");
    card.setAttribute("data-toolbox-section", "policy");
    const body = card.querySelector(".cxBody") as HTMLElement;

    const p = document.createElement("p");
    p.style.cssText = "opacity:0.85;margin:0 0 8px 0;";
    p.textContent = "SAFE_MODE enforces deterministic builtins only. Registry rendering is restricted in STRICT mode.";
    body.appendChild(p);

    const ul = document.createElement("ul");
    ul.style.cssText = "margin:0;padding-left:18px;opacity:0.9;";
    ["No inline handlers", "No javascript: URLs", "No data:text/html"].forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      ul.appendChild(li);
    });
    body.appendChild(ul);

    appendAction(body, "Acknowledge", () => {
      p.textContent = "Policy acknowledged (local only).";
    }, ctx.safeMode);

    root.appendChild(card);
  }
};
