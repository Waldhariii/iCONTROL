import { blockKeyValueTable } from "../../_shared/uiBlocks";
import { MAIN_SYSTEM_THEME } from "../../_shared/mainSystem.data";
import { recordObs } from "../../_shared/audit";
import { OBS } from "../../_shared/obsCodes";

type RecSeverity = "INFO" | "WARN" | "CRITICAL";
type RecScope = "UI" | "DOSSIER" | "SYSTEM";

type Recommendation = {
  id: string;
  severity: RecSeverity;
  scope: RecScope;
  title: string;
  why: string;
  actionHint: string;
};

const TOK = MAIN_SYSTEM_THEME.tokens;
const REC_STYLE = `padding:12px;border-radius:14px;background:${TOK.card};border:1px solid ${TOK.border};`;
const REC_TITLE = `font-weight:900;margin:0 0 6px 0;color:${TOK.text};`;
const REC_META = `margin:0 0 8px 0;color:${TOK.mutedText};`;
const REC_HINT = `margin:0;color:${TOK.text};`;
const REC_BADGE = `display:inline-block;padding:2px 8px;border-radius:999px;border:1px solid ${TOK.border};background:${TOK.panel};font-weight:800;margin-right:8px;`;

function computeRecommendations(): Recommendation[] {
  const recs: Recommendation[] = [];

  recs.push({
    id: "UI_NO_OPACITY_TEXT",
    severity: "WARN",
    scope: "UI",
    title: "Contraste UI: éviter l’opacité sur le texte",
    why: "L’opacité dégrade la lisibilité et varie selon le fond/thème.",
    actionHint: "Remplacer opacity par tokens.mutedText / tokens.text selon le cas."
  });

  recs.push({
    id: "SAFE_MODE_STRICT_WRITE_BLOCK",
    severity: "INFO",
    scope: "DOSSIER",
    title: "SAFE_MODE STRICT: écriture bloquée",
    why: "Les actions d’écriture doivent être non-opérationnelles en STRICT.",
    actionHint: "UI read-only + émettre WARN_SAFE_MODE_WRITE_BLOCKED lors d’une tentative."
  });

  recs.push({
    id: "RBAC_3_ROLE_POLICY",
    severity: "INFO",
    scope: "SYSTEM",
    title: "RBAC: politique 3 rôles",
    why: "Réduire la dérive des rôles et stabiliser la navigation/accès.",
    actionHint: "Limiter SYSADMIN/DEVELOPER/ADMIN + tests de non-régression."
  });

  return recs;
}

export function renderRecommendations(host: HTMLElement): void {
  const recs = computeRecommendations();

  recordObs({ code: OBS.INFO, actionId: "rules.recommendations.render", detail: `count=${recs.length}` });

  const wrap = document.createElement("div");
  wrap.setAttribute("style", "display:grid;gap:10px;margin-top:12px;");

  recs.forEach((r) => {
    const card = document.createElement("div");
    card.setAttribute("style", REC_STYLE);

    const h = document.createElement("p");
    h.setAttribute("style", REC_TITLE);
    h.innerHTML = `<span style="${REC_BADGE}">${r.severity}</span>${r.title}`;

    const meta = document.createElement("p");
    meta.setAttribute("style", REC_META);
    meta.textContent = `scope=${r.scope} • id=${r.id}`;

    const why = document.createElement("p");
    why.setAttribute("style", REC_META);
    why.textContent = r.why;

    const hint = document.createElement("p");
    hint.setAttribute("style", REC_HINT);
    hint.textContent = `Recommandation: ${r.actionHint}`;

    card.appendChild(h);
    card.appendChild(meta);
    card.appendChild(why);
    card.appendChild(hint);
    wrap.appendChild(card);
  });

  host.appendChild(wrap);
}

export function renderDossiersRules(root: HTMLElement): void {
  root.appendChild(
    blockKeyValueTable({
      title: "Regles (RBAC/SAFE_MODE)",
      rows: [
        { key: "Roles", value: "SYSADMIN / DEVELOPER / ADMIN / USER" },
        { key: "Ecriture", value: "SYSADMIN/DEVELOPER/ADMIN seulement" },
        { key: "SAFE_MODE STRICT", value: "actions d'ecriture bloquees" },
        { key: "CLOSED", value: "edits bloques, actions masquees" },
        { key: "Workflow", value: "OPEN → IN_PROGRESS → WAITING → CLOSED" }
      ]
    })
  );
  renderRecommendations(root);
}
