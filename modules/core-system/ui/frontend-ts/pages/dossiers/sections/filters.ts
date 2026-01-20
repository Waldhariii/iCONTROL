/**
 // @placeholder owner:tbd expiry:2099-12-31 risk:low tag:WARN_PLACEHOLDER_NOT_IMPLEMENTED
 * PLACEHOLDER GOVERNANCE
 * @placeholder
 * code: WARN_PLACEHOLDER_NOT_IMPLEMENTED
 * owner: core-platform
 * expiry: TBD
 * risk: LOW
 * file: modules/core-system/ui/frontend-ts/pages/dossiers/sections/filters.ts
 * created_at: 2026-01-20T01:13:27.385Z
 *
 * Rationale:
 * - Stub de compilation pour unblock bundling/tests.
 * - À remplacer par une implémentation réelle avant prod.
 */

import { blockFilterInput, sectionCard } from "../../_shared/uiBlocks";

export type DossiersFilter = {
  query: string;
  status: "ALL" | "OPEN" | "IN_PROGRESS" | "WAITING" | "CLOSED";
};

const state: DossiersFilter = { query: "", status: "ALL" };

export function getDossiersFilters(): DossiersFilter {
  return { ...state };
}

export function renderDossiersFilters(host: HTMLElement, onChange: () => void): void {
  const card = sectionCard("Filtres");
  const wrap = document.createElement("div");
  wrap.style.cssText = "display:flex;gap:10px;flex-wrap:wrap;margin-top:8px";

  const input = blockFilterInput({
    placeholder: "Rechercher...",
    value: state.query,
    onChange: (next) => {
      state.query = next;
      onChange();
    }
  });

  const select = document.createElement("select");
  select.style.cssText = "padding:8px 10px;border-radius:10px;border:1px solid var(--line);background:transparent;color:inherit;";
  ["ALL", "OPEN", "IN_PROGRESS", "WAITING", "CLOSED"].forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    if (s === state.status) opt.selected = true;
    select.appendChild(opt);
  });
  select.addEventListener("change", () => {
    state.status = select.value as DossiersFilter["status"];
    onChange();
  });

  wrap.appendChild(input);
  wrap.appendChild(select);
  card.appendChild(wrap);
  host.appendChild(card);
}
