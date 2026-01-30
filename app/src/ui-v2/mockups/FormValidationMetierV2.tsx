import React, { useMemo, useState } from "react";

type FormState = {
  client: string;
  date: string;
  montant: string;
};

function validate(s: FormState) {
  const errors: Record<string, string> = {};
  if (!s.client.trim()) errors.client = "Client requis.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s.date)) errors.date = "Date invalide (YYYY-MM-DD).";
  const m = Number(s.montant);
  if (!Number.isFinite(m) || m <= 0) errors.montant = "Montant invalide.";
  return errors;
}

export default function FormValidationMetierV2() {
  const [state, setState] = useState<FormState>({ client: "", date: "", montant: "" });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const errors = useMemo(() => validate(state), [state]);
  const canSubmit = Object.keys(errors).length === 0;

  function onChange<K extends keyof FormState>(k: K, v: string) {
    setState(prev => ({ ...prev, [k]: v }));
  }

  function onBlur(k: keyof FormState) {
    setTouched(prev => ({ ...prev, [k]: true }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ client: true, date: true, montant: true });
    if (!canSubmit) return;
    // mock submit
    alert(`Mock submit: ${JSON.stringify(state)}`);
  }

  const show = (k: keyof FormState) => touched[k] && errors[k];

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gap: 6 }}>
        <label>Client</label>
        <input
          value={state.client}
          onChange={(e) => onChange("client", e.target.value)}
          onBlur={() => onBlur("client")}
        />
        {show("client") ? <div style={{ fontSize: 12 }}>{errors.client}</div> : null}
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <label>Date</label>
        <input
          value={state.date}
          placeholder="2026-01-30"
          onChange={(e) => onChange("date", e.target.value)}
          onBlur={() => onBlur("date")}
        />
        {show("date") ? <div style={{ fontSize: 12 }}>{errors.date}</div> : null}
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <label>Montant</label>
        <input
          value={state.montant}
          placeholder="0.00"
          onChange={(e) => onChange("montant", e.target.value)}
          onBlur={() => onBlur("montant")}
        />
        {show("montant") ? <div style={{ fontSize: 12 }}>{errors.montant}</div> : null}
      </div>

      <button type="submit" disabled={!canSubmit}>
        Créer (mock)
      </button>
    </form>
  );
}
