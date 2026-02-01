/**
 * CP Login Theme (vanilla)
 * Objectif: page de configuration du branding de login (tokens, logo, fond, CTA)
 * Zéro React (pour garder Vite/rollup clean dans ce repo).
 */

function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, any> = {},
  ...children: (Node | string | null | undefined)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null) continue;
    if (k === "style" && typeof v === "object") Object.assign((el as any).style, v);
    else if (k.startsWith("on") && typeof v === "function") (el as any)[k.toLowerCase()] = v;
    else el.setAttribute(k, String(v));
  }
  for (const c of children) {
    if (c === null || c === undefined) continue;
    el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return el;
}

export function render(root: HTMLElement) {
  root.innerHTML = "";

  const wrap = h("div", { style: { padding: "24px" } });

  wrap.appendChild(h("h1", { style: { fontSize: "22px", fontWeight: "700", margin: "0 0 8px 0" } }, "Login Theme"));
  wrap.appendChild(
    h(
      "p",
      { style: { opacity: "0.82", margin: "0 0 16px 0", lineHeight: "1.45" } },
      "Configuration du branding multi-tenant pour l’écran de login (tokens, logo, fond, CTA)."
    )
  );

  const card = h("div", {
    style: {
      padding: "16px",
      border: "1px solid var(--icontrol-color-fallback-border)",
      borderRadius: "12px",
      maxWidth: "860px",
    },
  });

  card.appendChild(h("div", { style: { fontWeight: "650", marginBottom: "6px" } }, "Roadmap (prochaine itération)"));
  card.appendChild(
    h(
      "ul",
      { style: { margin: "0", paddingLeft: "18px", opacity: "0.85" } },
      h("li", {}, "Preset selector (ex: cp-dashboard-charcoal vs login-mauve-midnight)"),
      h("li", {}, "Upload logo + preview (sandbox VFS)"),
      h("li", {}, "Éditeur de tokens (design.tokens scope cp.login_theme)"),
      h("li", {}, "Publish/rollback avec SAFE_MODE + audit trail")
    )
  );

  wrap.appendChild(card);

  const hint = h(
    "div",
    { style: { marginTop: "14px", opacity: "0.75", fontSize: "13px" } },
    "KPI: page navigable + zéro dette technique (pas de React requis)."
  );
  wrap.appendChild(hint);

  root.appendChild(wrap);
}

export default { render };
