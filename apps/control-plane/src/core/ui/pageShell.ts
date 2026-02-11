/**
 * ICONTROL_PAGE_SHELL_V1
 * Conteneur standardisé pour toutes les pages CP
 */
import { createBadge, createSafeModeBadge } from "./badge";
import { createButton } from "./button";

export interface PageAction {
  label: string;
  onClick: () => void;
  icon?: string;
  primary?: boolean;
}

export type BreadcrumbItem = string | { label: string; href?: string };

export interface PageShellOptions {
  title: string;
  subtitle?: string;
  /** Segments cliquables : `{ label, href }` = lien, `string` ou `{ label }` sans href = texte seul. */
  breadcrumbs?: BreadcrumbItem[];
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
  shell.className = "ic-page-shell";

  const header = document.createElement("div");
  header.className = "ic-page-shell__header";

  const titleRow = document.createElement("div");
  titleRow.className = "ic-page-shell__title-row";

  const titleBlock = document.createElement("div");
  titleBlock.className = "ic-page-shell__title-block";

  if (options.breadcrumbs && options.breadcrumbs.length > 0) {
    const crumbs = document.createElement("nav");
    crumbs.setAttribute("aria-label", "Fil d'Ariane");
    crumbs.className = "ic-page-shell__breadcrumbs";
    const sep = " / ";
    options.breadcrumbs.forEach((it, i) => {
      if (i > 0) crumbs.appendChild(document.createTextNode(sep));
      const item = typeof it === "string" ? { label: it } : it;
      if (item.href) {
        const a = document.createElement("a");
        a.href = item.href;
        a.textContent = item.label;
        a.className = "ic-page-shell__breadcrumb-link";
        crumbs.appendChild(a);
      } else {
        const s = document.createElement("span");
        s.textContent = item.label;
        crumbs.appendChild(s);
      }
    });
    titleBlock.appendChild(crumbs);
  }

  const title = document.createElement("div");
  title.textContent = options.title;
  title.className = "ic-page-shell__title";
  titleBlock.appendChild(title);

  if (options.subtitle) {
    const subtitle = document.createElement("div");
    subtitle.textContent = options.subtitle;
    subtitle.className = "ic-page-shell__subtitle";
    titleBlock.appendChild(subtitle);
  }

  titleRow.appendChild(titleBlock);

  if (options.actions && options.actions.length > 0) {
    const actions = document.createElement("div");
    actions.className = "ic-page-shell__actions";
    options.actions.forEach((action) => {
      const btn = createButton({
        label: action.label,
        variant: action.primary ? "primary" : "secondary",
        size: "small",
        ...(action.icon ? { icon: action.icon } : {}),
        onClick: () => action.onClick()
      });
      actions.appendChild(btn);
    });
    titleRow.appendChild(actions);
  }

  header.appendChild(titleRow);

  const metaRow = document.createElement("div");
  metaRow.className = "ic-page-shell__meta";

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
  content.className = "ic-page-shell__content";

  shell.appendChild(header);
  shell.appendChild(content);

  return { shell, header, content };
}
