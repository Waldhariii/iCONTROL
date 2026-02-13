// @ts-nocheck
import { recordObs } from "./audit";
import { OBS } from "./obsCodes";

export type SafeMode = "STRICT" | "COMPAT";
export type Role = "ADMIN" | "DEVELOPER" | "SYSADMIN" | "USER" | string;

export type RecoContext = {
  pageId: string;
  scopeId: string;
  role: Role;
  safeMode: SafeMode;
  entityType?: string;
  entityState?: string;
  blockedReason?: string;
};

export type Recommendation = {
  id: string;
  title: string;
  body: string;
  level: "INFO" | "WARN";
};

function uniqById(items: Recommendation[]): Recommendation[] {
  const seen = new Set<string>();
  return items.filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)));
}


export function buildRecommendations(_ctx: RecoContext): Recommendation[] {
  return [];
}

export function renderRecommendations(host: HTMLElement, ctx: RecoContext): void {
  const recos = buildRecommendations(ctx);
  if (!recos.length) return;

  const UI = {
    CARD: "padding:12px 14px;border-radius:16px;background:var(--ic-card);border:1px solid var(--ic-border);color:var(--ic-text);margin:10px 0;",
    TITLE: "font-weight:900;letter-spacing:.2px;margin-bottom:8px;",
    LIST: "margin:0;padding-left:18px;display:flex;flex-direction:column;gap:8px;",
    ITEM_TITLE: (level: Recommendation["level"]) =>
      `font-weight:800;color:${level === "WARN" ? "var(--ic-accent, var(--ic-text))" : "var(--ic-text)"};`,
    ITEM_BODY: "margin-top:2px;color:var(--ic-mutedText);line-height:1.25;"
  } as const;

  const card = document.createElement("div");
  card.setAttribute("style", UI.CARD);

  const h = document.createElement("div");
  h.textContent = "Recommandations";
  h.setAttribute("style", UI.TITLE);
  card.appendChild(h);

  const ul = document.createElement("ul");
  ul.setAttribute("style", UI.LIST);

  recos.forEach((r) => {
    const li = document.createElement("li");
    const title = document.createElement("div");
    title.textContent = r.title;
    title.setAttribute("style", UI.ITEM_TITLE(r.level));
    const body = document.createElement("div");
    body.textContent = r.body;
    body.setAttribute("style", UI.ITEM_BODY);
    li.appendChild(title);
    li.appendChild(body);
    ul.appendChild(li);
  });

  card.appendChild(ul);
  host.appendChild(card);

  recordObs({
    code: OBS.INFO_RECOMMENDATIONS_SHOWN,
    actionId: ctx.scopeId,
    detail: `count=${recos.length}`
  });
}
