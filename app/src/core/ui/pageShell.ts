/**
 * ICONTROL_PAGE_SHELL_V1
 * Conteneur standardisé pour toutes les pages CP
 */
import { createBadge, createSafeModeBadge } from "./badge";

export interface PageAction {
  label: string;
  onClick: () => void;
  icon?: string;
  primary?: boolean;
}

export interface PageShellOptions {
  title: string;
  subtitle?: string;
  breadcrumbs?: string[];
  actions?: PageAction[];
  safeMode?: "OFF" | "COMPAT" | "STRICT";
  statusBadge?: { label: string; tone?: "neutral" | "info" | "ok" | "warn" | "err" | "accent" };
}

export function createPageShell(options: PageShellOptions): {
  shell: HTMLElement;
  header: HTMLElement;
  content: HTMLElement;
} {
  const shell = document.createElement("div");
  shell.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
  `;

  const header = document.createElement("div");
  header.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px;
    border: 1px solid var(--ic-border, #2b3136);
    background: var(--ic-card, #1a1d1f);
    border-radius: 10px;
  `;

  const titleRow = document.createElement("div");
  titleRow.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  `;

  const titleBlock = document.createElement("div");
  titleBlock.style.cssText = "display:flex; flex-direction:column; gap:4px;";

  if (options.breadcrumbs && options.breadcrumbs.length > 0) {
    const crumbs = document.createElement("div");
    crumbs.textContent = options.breadcrumbs.join(" / ");
    crumbs.style.cssText = "font-size: 11px; color: var(--ic-mutedText, #a7b0b7); letter-spacing: 0.2px;";
    titleBlock.appendChild(crumbs);
  }

  const title = document.createElement("div");
  title.textContent = options.title;
  title.style.cssText = "font-size: 18px; font-weight: 700; color: var(--ic-text, #e7ecef);";
  titleBlock.appendChild(title);

  if (options.subtitle) {
    const subtitle = document.createElement("div");
    subtitle.textContent = options.subtitle;
    subtitle.style.cssText = "font-size: 13px; color: var(--ic-mutedText, #a7b0b7);";
    titleBlock.appendChild(subtitle);
  }

  titleRow.appendChild(titleBlock);

  if (options.actions && options.actions.length > 0) {
    const actions = document.createElement("div");
    actions.style.cssText = "display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end;";
    options.actions.forEach((action) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = action.icon ? `${action.icon} ${action.label}` : action.label;
      btn.style.cssText = `
        padding: 8px 14px;
        border-radius: 8px;
        border: 1px solid ${action.primary ? "var(--ic-accent, #7b2cff)" : "var(--ic-border, #2b3136)"};
        background: ${action.primary ? "var(--ic-accent, #7b2cff)" : "transparent"};
        color: ${action.primary ? "white" : "var(--ic-text, #e7ecef)"};
        font-weight: 600;
        font-size: 12px;
        cursor: pointer;
      `;
      btn.onclick = action.onClick;
      actions.appendChild(btn);
    });
    titleRow.appendChild(actions);
  }

  header.appendChild(titleRow);

  const metaRow = document.createElement("div");
  metaRow.style.cssText = "display:flex; gap:8px; flex-wrap:wrap;";

  if (options.safeMode) {
    metaRow.appendChild(createSafeModeBadge(options.safeMode));
  }

  if (options.statusBadge) {
    metaRow.appendChild(createBadge(options.statusBadge.label, options.statusBadge.tone || "neutral"));
  }

  if (metaRow.childElementCount > 0) {
    header.appendChild(metaRow);
  }

  const content = document.createElement("div");
  content.style.cssText = "display:flex; flex-direction:column; gap:16px; min-width:0; width:100%; box-sizing:border-box;";

  shell.appendChild(header);
  shell.appendChild(content);

  return { shell, header, content };
}
