import { getRole, canAccessToolbox } from "/src/runtime/rbac";
import { getSafeMode } from "./_shared/safeMode";
import { getSession } from "./_shared/localAuth";
import { renderAccessDenied, safeRender } from "./_shared/mainSystem.shared";
import { mountSections, type SectionSpec } from "./_shared/sections";
import type { ToolboxCtx } from "./toolbox/contracts";
import { TOOLBOX_SECTIONS } from "./toolbox/sections";
import { createPageShell } from "/src/core/ui/pageShell";

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
    const { shell, content } = createPageShell({
      title: "Diagnostic",
      subtitle: `Rôle: ${ctx.role} • Safe mode: ${ctx.safeMode ? "ON" : "OFF"}`,
      safeMode: ctx.safeMode ? "STRICT" : "COMPAT"
    });
    root.appendChild(shell);
    mountSections(content, sections, { page: "toolbox", role: ctx.role, safeMode: ctx.safeMode ? "STRICT" : "COMPAT" });
  });
}
