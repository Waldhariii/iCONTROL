// @ts-nocheck
type AccessDeniedProps = {
  entitlement?: string;
};

export function renderAccessDeniedPage(root: HTMLElement, props: AccessDeniedProps = {}): void {
  const ent = (props.entitlement || "").trim();
  root.innerHTML = "";

  const wrap = document.createElement("div");
  wrap.style.cssText = "padding:24px;max-width:820px";

  const h1 = document.createElement("h1");
  h1.textContent = "Accès restreint";
  wrap.appendChild(h1);

  const p = document.createElement("p");
  p.style.cssText = "margin-top:8px";
  p.textContent = "Cette fonctionnalité n’est pas activée pour ce tenant. Aucun décodage requis — il suffit de provisionner l’entitlement.";
  wrap.appendChild(p);

  if (ent) {
    const card = document.createElement("div");
    card.style.cssText = "margin-top:12px;padding:12px;border:1px solid var(--ic-border);border-radius:8px";
    const strong = document.createElement("strong");
    strong.textContent = "Entitlement requis:";
    const code = document.createElement("code");
    code.textContent = ent;
    card.appendChild(strong);
    card.appendChild(document.createTextNode(" "));
    card.appendChild(code);
    wrap.appendChild(card);
  }

  const actions = document.createElement("div");
  actions.style.cssText = "margin-top:16px;display:flex;gap:12px;flex-wrap:wrap";
  const linkLogs = document.createElement("a");
  linkLogs.href = "#/logs";
  linkLogs.style.cssText = "padding:10px 14px;border-radius:8px;border:1px solid var(--ic-border);text-decoration:none";
  linkLogs.textContent = "Voir les logs / audit";
  actions.appendChild(linkLogs);
  wrap.appendChild(actions);

  const note = document.createElement("p");
  note.style.cssText = "margin-top:18px;opacity:.8";
  note.textContent = "Gouvernance: l’accès est bloqué par policy (entitlements), et l’événement est tracé (WARN).";
  wrap.appendChild(note);

  root.appendChild(wrap);
}

export default renderAccessDeniedPage;
