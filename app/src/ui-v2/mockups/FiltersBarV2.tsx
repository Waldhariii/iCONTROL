import React from "react";
import { ButtonV2 } from "../ButtonV2";

export type FiltersState = {
  q: string;
  statut: "tous" | "brouillon" | "planifie" | "en_cours" | "termine";
};

export function FiltersBarV2(props: {
  value: FiltersState;
  onChange: (v: FiltersState) => void;
}) {
  const v = props.value;

  return (
    <div className="v2-filters">
      <input
        className="v2-input v2-filter__input"
        placeholder="Recherche… (client, code, note)"
        value={v.q}
        onChange={(e) => props.onChange({ ...v, q: e.target.value })}
      />

      <select
        className="v2-input v2-filter__select"
        value={v.statut}
        onChange={(e) => props.onChange({ ...v, statut: e.target.value as FiltersState["statut"] })}
      >
        <option value="tous">Tous statuts</option>
        <option value="brouillon">Brouillon</option>
        <option value="planifie">Planifié</option>
        <option value="en_cours">En cours</option>
        <option value="termine">Terminé</option>
      </select>

      <div className="v2-filter__actions">
        <ButtonV2 label="Nouveau (mock)" onClick={() => void 0} />
      </div>
    </div>
  );
}
