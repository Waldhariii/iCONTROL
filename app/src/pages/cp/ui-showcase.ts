import { h } from "../_shared/dom";
import { createSectionCard } from "./_shared/sectionCard";
import { setCss, appendCss } from "../../../core/ui/inlineCss";
import { isDevOnlyAllowed } from "../../core/policies/devOnly";

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, any> = {}, children: any[] = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "style") { setCss(node as HTMLElement, String(v)); return; }
    else if (k.startsWith("on") && typeof v === "function") (node as any)[k.toLowerCase()] = v;
    else node.setAttribute(k, String(v));
  }
  for (const c of children) {
    if (c == null) continue;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}

export function render() {
  
  /* ICONTROL_UI_SHOWCASE_DEV_ONLY_RUNTIME_GUARD */
  if (!isDevOnlyAllowed()) {
    try {
      const root = arguments[0];
      if (root && root instanceof HTMLElement) {
        root.innerHTML = "";
        const box = document.createElement("div");
        box.className = "ic-card";
        box.innerHTML =
          "<div class=\"ic-section-card__header\">\n" +
          "  <div class=\"ic-section-card__title-row\">\n" +
          "    <div class=\"ic-section-card__title\">UI Showcase</div>\n" +
          "  </div>\n" +
          "  <div class=\"ic-section-card__desc\">DEV-only. Cette page n'est pas disponible dans cet environnement.</div>\n" +
          "</div>\n";
        root.appendChild(box);
      }
    } catch {}
    return;
  }

const root = el("div", {
    style: [
      "padding:18px",
      "max-width:1200px",
      "margin:0 auto",
      "color:var(--ic-text)",
    ].join(";"),
  });

  const header = el("div", { style: "display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;" }, [
    el("div", {}, [
      el("div", { style: "font-size:18px;font-weight:800;letter-spacing:.3px;" }, ["UI Showcase (DEV-only)"]),
      el("div", { style: "margin-top:4px;color:var(--ic-mutedText);font-size:13px;" }, [
        "Validation visuelle SSOT (tokens, composants, états).",
      ]),
    ]),
    el("a", {
      href: "/cp/#/dashboard",
      style: "padding:8px 12px;border-radius:10px;border:1px solid var(--ic-border);text-decoration:none;color:inherit;background:var(--ic-panel);font-weight:700;font-size:12px;"
    }, ["Retour dashboard"]),
  ]);

  root.appendChild(header);

  const grid = el("div", { style: "display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:12px;" });

  // Card: Tokens preview
  const { card: tokCard, body: tokBody } = createSectionCard({
    title: "Tokens — aperçu",
    description: "Les variables CSS actives (lecture seule).",
  });

  const sample = el("div", { style: "display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:10px;" }, [
    el("div", { style: "padding:12px;border-radius:12px;background:var(--ic-panel);border:1px solid var(--ic-border);" }, [
      el("div", { style: "font-weight:800;margin-bottom:6px;" }, ["Surface / Panel"]),
      el("div", { style: "color:var(--ic-mutedText);font-size:12px;" }, ["bg: var(--ic-panel)"]),
    ]),
    el("div", { style: "padding:12px;border-radius:12px;background:var(--ic-card);border:1px solid var(--ic-border);" }, [
      el("div", { style: "font-weight:800;margin-bottom:6px;" }, ["Card"]),
      el("div", { style: "color:var(--ic-mutedText);font-size:12px;" }, ["bg: var(--ic-card)"]),
    ]),
  ]);

  tokBody.appendChild(sample);
  appendCss(tokCard, "grid-column: span 6;");
  grid.appendChild(tokCard);

  // Card: Controls
  const { card: ctlCard, body: ctlBody } = createSectionCard({
    title: "Contrôles",
    description: "Boutons, inputs, états.",
  });

  const input = el("input", {
    value: "Exemple",
    style: "width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--ic-border);background:var(--ic-inputBg);color:var(--ic-text);outline:none;",
  });

  const row = el("div", { style: "display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;" }, [
    el("button", { style: "padding:10px 14px;border-radius:10px;border:1px solid transparent;background:var(--ic-accent);color:var(--ic-textOnAccent, #000);font-weight:800;cursor:pointer;" }, ["Primary"]),
    el("button", { style: "padding:10px 14px;border-radius:10px;border:1px solid var(--ic-border);background:transparent;color:var(--ic-text);font-weight:800;cursor:pointer;" }, ["Secondary"]),
    el("button", { disabled: "true", style: "padding:10px 14px;border-radius:10px;border:1px solid var(--ic-border);background:transparent;color:var(--ic-mutedText);font-weight:800;opacity:.6;cursor:not-allowed;" }, ["Disabled"]),
  ]);

  ctlBody.appendChild(input);
  ctlBody.appendChild(row);
  appendCss(ctlCard, "grid-column: span 6;");
  grid.appendChild(ctlCard);

  // Card: Table (Excel style)
  const { card: tblCard, body: tblBody } = createSectionCard({
    title: "Table (Excel style)",
    description: "Lisibilité + hover + séparateurs.",
  });

  const table = el("table", { style: "width:100%;border-collapse:separate;border-spacing:0;margin-top:10px;overflow:hidden;border-radius:12px;border:1px solid var(--ic-border);" });
  const thead = el("thead", { style: "background:var(--ic-panel);" });
  const trh = el("tr");
  ["Client", "Statut", "Montant", "Dernière activité"].forEach(hd => {
    trh.appendChild(el("th", { style: "text-align:left;padding:10px 12px;font-size:12px;color:var(--ic-mutedText);border-bottom:1px solid var(--ic-border);" }, [hd]));
  });
  thead.appendChild(trh);

  const tbody = el("tbody");
  const rows = [
    ["Safari Park", "Actif", "$ 12,450", "2026-01-29"],
    ["Groupe Thermique", "En attente", "$ 3,100", "2026-01-27"],
    ["Innovex Extermination", "Actif", "$ 980", "2026-01-26"],
  ];
  rows.forEach(r => {
    const tr = el("tr", { style: "background:var(--ic-card);" });
    tr.addEventListener("mouseenter", () => tr.style.background = "var(--ic-highlightMuted)");
    tr.addEventListener("mouseleave", () => tr.style.background = "var(--ic-card)");
    r.forEach((c) => tr.appendChild(el("td", { style: "padding:10px 12px;border-bottom:1px solid var(--ic-border);font-size:13px;" }, [c])));
    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  tblBody.appendChild(table);

  appendCss(tblCard, "grid-column: span 12;");
  grid.appendChild(tblCard);

  
  // ICONTROL_UI_SHOWCASE_V2 — Modal + Toast + KPI (DEV-only), zero CSS imports.

  // KPI strip
  const kpiWrap = el("div", { style: "display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:12px;margin-top:12px;" });
  const kpis = [
    { t: "Revenus (7j)", v: "$ 18,240", s: "+12%" },
    { t: "Jobs", v: "46", s: "+4" },
    { t: "Conversion", v: "22.8%", s: "+1.2pt" },
    { t: "Tickets", v: "9", s: "-2" },
  ];
  for (const k of kpis) {
    const card = el("div", { style: "grid-column: span 3; padding:12px;border-radius:12px;background:var(--ic-card);border:1px solid var(--ic-border); position:relative; overflow:hidden;" }, [
      el("div", { style: "font-size:12px;color:var(--ic-mutedText);font-weight:700;" }, [k.t]),
      el("div", { style: "margin-top:6px;font-size:18px;font-weight:900;letter-spacing:.2px;" }, [k.v]),
      el("div", { style: "margin-top:4px;font-size:12px;font-weight:800;color:var(--ic-accent);" }, [k.s]),
      el("div", { style: "position:absolute;left:10px;right:10px;bottom:10px;height:4px;border-radius:999px;background:var(--ic-highlightMuted);overflow:hidden;opacity:.85;" }, [
        el("div", { style: "height:100%;width:58%;border-radius:999px;background:var(--ic-accent);" }),
      ]),
    ]);
    kpiWrap.appendChild(card);
  }
  root.appendChild(kpiWrap);

  // Toast system (simple)
  const toastHost = el("div", { style: "position:fixed;top:14px;right:14px;z-index:9999;display:flex;flex-direction:column;gap:10px;" });
  document.body.appendChild(toastHost);

  function toast(kind, title, msg) {
    const border = kind === "error" ? "var(--ic-errorBorder, var(--ic-accent))"
      : kind === "warn" ? "var(--ic-warnBorder, var(--ic-accent))"
      : "var(--ic-successBorder, var(--ic-accent))";
    const bg = kind === "error" ? "var(--ic-errorBg, var(--ic-accentBg))"
      : kind === "warn" ? "var(--ic-warnBg, var(--ic-accentBg))"
      : "var(--ic-successBg, var(--ic-accentBg))";

    const item = el("div", { style: "min-width:280px;max-width:340px;padding:10px 12px;border-radius:12px;border:1px solid " + border + ";background:" + bg + ";backdrop-filter: blur(8px); box-shadow: var(--ic-shadowToast, var(--ic-shadow));" }, [
      el("div", { style: "font-weight:900;letter-spacing:.2px;font-size:13px;" }, [title]),
      el("div", { style: "margin-top:3px;color:var(--ic-text);opacity:.9;font-size:12px;line-height:1.35;" }, [msg]),
    ]);
    toastHost.appendChild(item);
    setTimeout(() => item.remove(), 2600);
  }

  // Modal system (simple)
  function openModal() {
    const overlay = el("div", { style: "position:fixed;inset:0;background:var(--ic-overlayBg);display:flex;align-items:center;justify-content:center;z-index:9998;padding:18px;" });
    const panel = el("div", { style: "width:min(720px,100%);background:var(--ic-panel);border:1px solid var(--ic-border);border-radius:14px;padding:16px;box-shadow:var(--ic-shadow);color:var(--ic-text);" }, [
      el("div", { style: "display:flex;align-items:center;justify-content:space-between;gap:10px;" }, [
        el("div", { style: "font-weight:900;font-size:14px;letter-spacing:.2px;" }, ["Modal — validation overlay"]),
        el("button", { style: "padding:8px 10px;border-radius:10px;border:1px solid var(--ic-border);background:transparent;color:inherit;cursor:pointer;font-weight:800;" , onclick: () => overlay.remove() }, ["Fermer"]),
      ]),
      el("div", { style: "margin-top:10px;color:var(--ic-mutedText);font-size:13px;line-height:1.45;" }, [
        "Objectif: valider contraste, radius, borders, et focus/interaction sans styles parallèles."
      ]),
      el("div", { style: "margin-top:12px;display:flex;gap:10px;flex-wrap:wrap;" }, [
        el("button", { style: "padding:10px 12px;border-radius:10px;border:1px solid transparent;background:var(--ic-accent);color:var(--ic-textOnAccent, #000);font-weight:900;cursor:pointer;" , onclick: () => toast("success","OK","Action confirmée.") }, ["Confirmer"]),
        el("button", { style: "padding:10px 12px;border-radius:10px;border:1px solid var(--ic-border);background:transparent;color:inherit;font-weight:900;cursor:pointer;" , onclick: () => toast("warn","Attention","Validation requise.") }, ["Warn"]),
        el("button", { style: "padding:10px 12px;border-radius:10px;border:1px solid var(--ic-border);background:transparent;color:inherit;font-weight:900;cursor:pointer;" , onclick: () => toast("error","Erreur","Échec simulé.") }, ["Error"]),
      ]),
    ]);

    overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
    document.addEventListener("keydown", function esc(ev) {
      if (ev.key === "Escape") {
        overlay.remove();
        document.removeEventListener("keydown", esc);
      }
    });
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
  }

  // Add action buttons row under header (by inserting into root after header)
  const actions = el("div", { style: "display:flex;gap:10px;flex-wrap:wrap;margin:8px 0 14px 0;" }, [
    el("button", { style: "padding:10px 12px;border-radius:10px;border:1px solid transparent;background:var(--ic-accent);color:var(--ic-textOnAccent, #000);font-weight:900;cursor:pointer;", onclick: () => openModal() }, ["Ouvrir modal"]),
    el("button", { style: "padding:10px 12px;border-radius:10px;border:1px solid var(--ic-border);background:transparent;color:inherit;font-weight:900;cursor:pointer;", onclick: () => toast("success","Succès","Toast success (2.6s).") }, ["Toast success"]),
    el("button", { style: "padding:10px 12px;border-radius:10px;border:1px solid var(--ic-border);background:transparent;color:inherit;font-weight:900;cursor:pointer;", onclick: () => toast("warn","Warning","Toast warning (2.6s).") }, ["Toast warn"]),
    el("button", { style: "padding:10px 12px;border-radius:10px;border:1px solid var(--ic-border);background:transparent;color:inherit;font-weight:900;cursor:pointer;", onclick: () => toast("error","Erreur","Toast error (2.6s).") }, ["Toast error"]),
  ]);

  // Insert actions after header: header is first child
  root.insertBefore(actions, root.children[1] || null);

  root.appendChild(grid);
  return root;

}

export default { render };
