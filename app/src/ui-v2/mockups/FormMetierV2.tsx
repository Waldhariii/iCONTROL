import React from "react";
import { FieldV2 } from "../components/FieldV2";
import { ButtonV2 } from "../ButtonV2";

type FormState = {
  client: string;
  statut: "brouillon" | "planifie" | "en_cours" | "termine";
  priorite: "basse" | "normale" | "haute" | "critique";
  date: string;
  note: string;
};

const statutOptions = [
  { value: "brouillon", label: "Brouillon" },
  { value: "planifie", label: "Planifié" },
  { value: "en_cours", label: "En cours" },
  { value: "termine", label: "Terminé" },
];

const prioOptions = [
  { value: "basse", label: "Basse" },
  { value: "normale", label: "Normale" },
  { value: "haute", label: "Haute" },
  { value: "critique", label: "Critique" },
];

export function FormMetierV2() {
  const [s, setS] = React.useState<FormState>({
    client: "Safari Park",
    statut: "planifie",
    priorite: "normale",
    date: new Date().toISOString().slice(0, 10),
    note: "Inspection + devis (mock).",
  });

  const [submitted, setSubmitted] = React.useState(false);

  const errors: Partial<Record<keyof FormState, string>> = {};
  if (submitted) {
    if (!s.client.trim()) errors.client = "Client requis.";
    if (!s.date.trim()) errors.date = "Date requise.";
  }

  return (
    <div className="v2-card">
      <div className="v2-card__header">
        <div className="v2-card__title">Fiche Job (Mock)</div>
        <div className="v2-card__subtitle">Formulaire isolé — aucun effet prod</div>
      </div>

      <div className="v2-form-grid">
        <FieldV2
          label="Client"
          required
          value={s.client}
          onChange={(v) => setS((p) => ({ ...p, client: v }))}
          hint="Nom de l’entreprise / contact."
          error={errors.client}
        />

        <FieldV2
          kind="select"
          label="Statut"
          value={s.statut}
          onChange={(v) => setS((p) => ({ ...p, statut: v as FormState["statut"] }))}
          options={statutOptions}
        />

        <FieldV2
          kind="select"
          label="Priorité"
          value={s.priorite}
          onChange={(v) => setS((p) => ({ ...p, priorite: v as FormState["priorite"] }))}
          options={prioOptions}
        />

        <FieldV2
          label="Date"
          required
          value={s.date}
          onChange={(v) => setS((p) => ({ ...p, date: v }))}
          hint="Format YYYY-MM-DD."
          error={errors.date}
        />

        <div className="v2-field v2-field--span2">
          <label className="v2-label">Note</label>
          <textarea
            className="v2-input v2-textarea"
            value={s.note}
            onChange={(e) => setS((p) => ({ ...p, note: e.target.value }))}
            rows={4}
          />
          <div className="v2-hint">Texte libre (mock).</div>
        </div>
      </div>

      <div className="v2-actions">
        <ButtonV2 label="Valider (mock)" onClick={() => setSubmitted(true)} />
        <ButtonV2
          label="Réinitialiser"
          variant="secondary"
          onClick={() => {
            setSubmitted(false);
            setS({
              client: "",
              statut: "brouillon",
              priorite: "normale",
              date: new Date().toISOString().slice(0, 10),
              note: "",
            });
          }}
        />
      </div>
    </div>
  );
}
