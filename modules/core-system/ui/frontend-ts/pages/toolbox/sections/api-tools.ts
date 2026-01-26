import type { ToolboxSection } from "../contracts";
import { createSectionCard, appendAction } from "../ui";

export const apiToolsSection: ToolboxSection = {
  id: "api-tools",
  title: "Outils API",
  render: (root, ctx) => {
    const card = createSectionCard("API Tools");
    card.setAttribute("data-toolbox-section", "api-tools");
    const body = card.querySelector(".cxBody") as HTMLElement;

    const p = document.createElement("p");
    p.style.cssText = "opacity:0.85;margin:0 0 8px 0;";
    p.textContent = ctx.safeMode
      ? "SAFE_MODE: read-only preview."
      : "Read-only preview (V1).";
    body.appendChild(p);

    const pre = document.createElement("pre");
    pre.style.cssText = "white-space:pre-wrap;margin:0;padding:10px;border:1px solid var(--ic-border);border-radius:10px;";
    pre.textContent = JSON.stringify({ endpoint: "/api/health", method: "GET", headers: { "x-request-id": "…" } }, null, 2);
    body.appendChild(pre);

    appendAction(body, "Ping", () => {
      p.textContent = "Ping scheduled (stub).";
    }, ctx.safeMode);

    root.appendChild(card);
  }
};
