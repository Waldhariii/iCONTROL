import { blockFilterInput, sectionCard } from "../../_shared/uiBlocks";

export type LogFilters = {
  query: string;
  level: "ALL" | "WARN" | "ERR";
};

const state: LogFilters = { query: "", level: "ALL" };

export function getLogFilters(): LogFilters {
  return { ...state };
}

export function renderLogsFilters(host: HTMLElement, onChange: () => void): void {
  const card = sectionCard("Filtres");
  const wrap = document.createElement("div");
  wrap.style.cssText = "display:flex;gap:10px;flex-wrap:wrap;margin-top:8px";

  const input = blockFilterInput({
    placeholder: "Filtrer code/texte...",
    value: state.query,
    onChange: (next) => {
      state.query = next;
      onChange();
    }
  });

  const select = document.createElement("select");
  select.style.cssText = "padding:8px 10px;border-radius:10px;border:1px solid var(--line);background:transparent;color:inherit;";
  ["ALL", "WARN", "ERR"].forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    if (s === state.level) opt.selected = true;
    select.appendChild(opt);
  });
  select.addEventListener("change", () => {
    state.level = select.value as LogFilters["level"];
    onChange();
  });

  wrap.appendChild(input);
  wrap.appendChild(select);
  card.appendChild(wrap);
  host.appendChild(card);
}
