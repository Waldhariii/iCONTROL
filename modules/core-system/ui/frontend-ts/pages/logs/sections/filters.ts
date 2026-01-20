import { blockFilterInput, sectionCard } from "../../../shared/uiBlocks";

export type LogFilters = {
  query: string;
  level: "ALL" | "WARN" | "ERR" | "INFO";
  module?: string;
  period?: "ALL" | "1H" | "24H" | "7D" | "30D";
};

const state: LogFilters = { query: "", level: "ALL", period: "ALL" };

export function getLogFilters(): LogFilters {
  return { ...state };
}

export function renderLogsFilters(host: HTMLElement, onChange: () => void): void {
  const card = sectionCard("Filtres de logs");
  const wrap = document.createElement("div");
  wrap.style.minWidth = "0";
  wrap.style.boxSizing = "border-box";
  wrap.style.cssText = "display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-top:8px";

  // Recherche textuelle
  const input = blockFilterInput({
    placeholder: "Rechercher (code, texte, contexte)...",
    value: state.query,
    onChange: (next) => {
      state.query = next;
      onChange();
    }
  });
  input.style.cssText = "width:100%;padding:10px 12px;border-radius:8px;border:1px solid var(--line);background:var(--ic-panel);color:var(--ic-text);";

  // Niveau de sévérité
  const levelSelect = document.createElement("select");
  levelSelect.style.cssText = "padding:10px 12px;border-radius:8px;border:1px solid var(--line);background:var(--ic-panel);color:var(--ic-text);cursor:pointer;";
  ["ALL", "INFO", "WARN", "ERR"].forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s === "ALL" ? "Tous les niveaux" : s;
    if (s === state.level) opt.selected = true;
    levelSelect.appendChild(opt);
  });
  levelSelect.addEventListener("change", () => {
    state.level = levelSelect.value as LogFilters["level"];
    onChange();
  });

  // Période
  const periodSelect = document.createElement("select");
  periodSelect.style.cssText = "padding:10px 12px;border-radius:8px;border:1px solid var(--line);background:var(--ic-panel);color:var(--ic-text);cursor:pointer;";
  [
    { value: "ALL", label: "Toutes les périodes" },
    { value: "1H", label: "Dernière heure" },
    { value: "24H", label: "24 dernières heures" },
    { value: "7D", label: "7 derniers jours" },
    { value: "30D", label: "30 derniers jours" }
  ].forEach(({ value, label }) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    if (value === (state.period || "ALL")) opt.selected = true;
    periodSelect.appendChild(opt);
  });
  periodSelect.addEventListener("change", () => {
    state.period = periodSelect.value as LogFilters["period"];
    onChange();
  });

  // Bouton réinitialiser
  const resetBtn = document.createElement("button");
  resetBtn.textContent = "Réinitialiser";
  resetBtn.style.cssText = "padding:10px 16px;border-radius:8px;border:1px solid var(--line);background:transparent;color:var(--ic-text);cursor:pointer;font-weight:600;";
  resetBtn.addEventListener("click", () => {
    state.query = "";
    state.level = "ALL";
    state.period = "ALL";
    state.module = undefined;
    input.value = "";
    levelSelect.value = "ALL";
    periodSelect.value = "ALL";
    onChange();
  });

  wrap.appendChild(input);
  wrap.appendChild(levelSelect);
  wrap.appendChild(periodSelect);
  wrap.appendChild(resetBtn);
  card.appendChild(wrap);
  host.appendChild(card);
}
