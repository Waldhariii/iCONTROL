import { recordObs } from "./audit";
import { OBS } from "./obsCodes";

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
  card.className = "cxNoticeCard";
  const title = document.createElement("div");
  title.className = "cxNoticeTitle";
  title.textContent = code;
  const meta = document.createElement("div");
  meta.className = "cxNoticeMeta";
  meta.textContent = `page=${detail.page} section=${detail.section}`;
  const msg = document.createElement("div");
  msg.className = "cxNoticeMsg";
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
      renderErrorCard(root, OBS.WARN_SECTION_BLOCKED, {
        page: ctx.page,
        section: section.id,
        message: `requiresRoles=${section.requiresRoles.join(",")}`
      });
      recordObs({
        code: OBS.WARN_SECTION_BLOCKED,
        page: ctx.page,
        section: section.id,
        detail: "requiresRoles"
      });
      failed.push(section.id);
      return;
    }
    if (section.requiresRole && ctx.role && ctx.role !== section.requiresRole) {
      renderErrorCard(root, OBS.WARN_SECTION_BLOCKED, {
        page: ctx.page,
        section: section.id,
        message: `requiresRole=${section.requiresRole}`
      });
      recordObs({
        code: OBS.WARN_SECTION_BLOCKED,
        page: ctx.page,
        section: section.id,
        detail: "requiresRole"
      });
      failed.push(section.id);
      return;
    }
    if (section.safeModeOk === false && ctx.safeMode === "STRICT") {
      renderErrorCard(root, OBS.WARN_SECTION_BLOCKED, {
        page: ctx.page,
        section: section.id,
        message: "safeMode=STRICT"
      });
      recordObs({
        code: OBS.WARN_SECTION_BLOCKED,
        page: ctx.page,
        section: section.id,
        detail: "safeMode=STRICT"
      });
      failed.push(section.id);
      return;
    }

    try {
      section.render(root);
      rendered.push(section.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      renderErrorCard(root, OBS.WARN_SECTION_CRASH, {
        page: ctx.page,
        section: section.id,
        message: msg
      });
      recordObs({
        code: OBS.WARN_SECTION_CRASH,
        page: ctx.page,
        section: section.id,
        detail: "exception"
      });
      failed.push(section.id);
    }
  });

  return { rendered, failed };
}
