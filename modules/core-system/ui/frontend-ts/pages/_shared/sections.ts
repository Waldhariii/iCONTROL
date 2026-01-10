export type SectionSpec = {
  id: string;
  title: string;
  render: (root: HTMLElement) => void;
  requiresRole?: string;
  requiresRoles?: string[];
  safeModeOk?: boolean;
};

export type MountResult = {
  rendered: string[];
  failed: string[];
};

export type MountContext = {
  page: string;
  role?: string;
  safeMode?: string;
};

export function renderErrorCard(
  root: HTMLElement,
  code: string,
  detail: { page: string; section: string; message: string }
): void {
  const card = document.createElement("div");
  card.style.cssText = [
    "margin:12px 0",
    "padding:12px",
    "border-radius:12px",
    "border:1px solid #c33",
    "background:rgba(255,255,255,0.03)"
  ].join(";");
  const title = document.createElement("div");
  title.style.cssText = "font-weight:800;margin-bottom:6px";
  title.textContent = code;
  const meta = document.createElement("div");
  meta.style.cssText = "font-size:12px;opacity:.85";
  meta.textContent = `page=${detail.page} section=${detail.section}`;
  const msg = document.createElement("div");
  msg.style.cssText = "margin-top:6px;white-space:pre-wrap";
  msg.textContent = detail.message;
  card.appendChild(title);
  card.appendChild(meta);
  card.appendChild(msg);
  root.appendChild(card);
}

export function mountSections(
  root: HTMLElement,
  sections: SectionSpec[],
  ctx: MountContext
): MountResult {
  const rendered: string[] = [];
  const failed: string[] = [];

  sections.forEach((section) => {
    if (section.requiresRoles && ctx.role && !section.requiresRoles.includes(ctx.role)) {
      renderErrorCard(root, "WARN_SECTION_BLOCKED", {
        page: ctx.page,
        section: section.id,
        message: `requiresRoles=${section.requiresRoles.join(",")}`
      });
      failed.push(section.id);
      return;
    }
    if (section.requiresRole && ctx.role && ctx.role !== section.requiresRole) {
      renderErrorCard(root, "WARN_SECTION_BLOCKED", {
        page: ctx.page,
        section: section.id,
        message: `requiresRole=${section.requiresRole}`
      });
      failed.push(section.id);
      return;
    }
    if (section.safeModeOk === false && ctx.safeMode === "STRICT") {
      renderErrorCard(root, "WARN_SECTION_BLOCKED", {
        page: ctx.page,
        section: section.id,
        message: "safeMode=STRICT"
      });
      failed.push(section.id);
      return;
    }

    try {
      section.render(root);
      rendered.push(section.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      renderErrorCard(root, "WARN_SECTION_CRASH", {
        page: ctx.page,
        section: section.id,
        message: msg
      });
      failed.push(section.id);
    }
  });

  return { rendered, failed };
}
