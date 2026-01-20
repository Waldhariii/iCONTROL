import { getRole, canAccessToolbox } from "/src/runtime/rbac";
import { getSafeMode } from "/src/core/runtime/safe";
import { getSession } from "/src/localAuth";
import { safeRender } from "/src/core/runtime/safe";
import { renderAccessDenied } from "/src/core/runtime/accessDenied";
import { mountSections, type SectionSpec } from "./shared/sections";
import type { ToolboxCtx } from "./toolbox/contracts";
import { TOOLBOX_SECTIONS } from "./toolbox/sections";

function buildCtx(): ToolboxCtx {
  const s = getSession();
  return {
    safeMode: getSafeMode() === "STRICT",
    role: getRole(),
    username: String(s?.username || "unknown")
  };
}

export function renderToolbox(root: HTMLElement): void {
  const ctx = buildCtx();
  if (!canAccessToolbox()) {
    renderAccessDenied(root, "Access denied.");
    return;
  }

  const sections: SectionSpec[] = TOOLBOX_SECTIONS.map((s) => ({
    id: s.id,
    title: s.title,
    render: (host) => s.render(host, ctx),
    safeModeOk: true
  }));

  safeRender(root, () => {
    root.innerHTML = "";
    const header = document.createElement("div");
    header.style.cssText = "max-width:980px;margin:24px auto 12px;padding:0 16px;";
    const h2 = document.createElement("h2");
    h2.style.cssText = "margin:0 0 6px 0;";
    h2.textContent = "Toolbox";
    const meta = document.createElement("div");
    meta.style.cssText = "opacity:0.8;";
    meta.textContent = `Role=${ctx.role} | SAFE_MODE=${ctx.safeMode ? "ON" : "OFF"}`;
    header.appendChild(h2);
    header.appendChild(meta);
    root.appendChild(header);

    const body = document.createElement("div");
    body.style.cssText = "max-width:980px;margin:0 auto;padding:0 16px;";
    root.appendChild(body);
    mountSections(body, sections, { page: "toolbox", role: ctx.role, safeMode: ctx.safeMode ? "STRICT" : "COMPAT" });
  });
}
