import React, { useState } from "react";

type FieldDef = {
  id: string;
  key: string;
  label: string;
  type: "text" | "textarea" | "date" | "money" | "email" | "phone" | "select" | "checkbox";
  required?: boolean;
  visibleForRoles?: string[];
  options?: string[];
  defaultValue?: string | number | boolean | null;
  validation?: {
    regex?: string;
    range?: { min?: number; max?: number };
  };
};

type FormDef = {
  id: string;
  fields: FieldDef[];
};

type Props = {
  form?: FormDef;
  role?: string;
};

function validateField(field: FieldDef, value: any): string {
  if (field.required && (value === undefined || value === null || value === "")) {
    return "Requis";
  }
  if (field.validation?.regex) {
    try {
      const re = new RegExp(field.validation.regex);
      if (value && !re.test(String(value))) return "Format invalide";
    } catch {
      return "Regex invalide";
    }
  }
  if (field.validation?.range && field.type === "money") {
    const num = Number(value);
    if (Number.isNaN(num)) return "Nombre invalide";
    const { min, max } = field.validation.range;
    if (min !== undefined && num < min) return "Trop petit";
    if (max !== undefined && num > max) return "Trop grand";
  }
  return "";
}

export default function Form({ form, role = "USER_READONLY" }: Props) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!form) return <div className="smallMuted">Formulaire non défini</div>;

  const visibleFields = (form.fields || []).filter((f) => {
    if (!f.visibleForRoles || f.visibleForRoles.length === 0) return true;
    return f.visibleForRoles.includes(role);
  });

  const onChange = (field: FieldDef, value: any) => {
    setValues((prev) => ({ ...prev, [field.key]: value }));
    const msg = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field.key]: msg }));
  };

  return (
    <div className="studio-form">
      {visibleFields.map((field) => {
        const val = values[field.key] ?? field.defaultValue ?? (field.type === "checkbox" ? false : "");
        const err = errors[field.key];
        if (field.type === "textarea") {
          return (
            <div key={field.id} className="studio-form-field">
              <div className="smallMuted">{field.label}</div>
              <textarea
                className="inputX"
                value={String(val)}
                onChange={(e) => onChange(field, e.target.value)}
              />
              {err && <div className="smallMuted">{err}</div>}
            </div>
          );
        }
        if (field.type === "select") {
          return (
            <div key={field.id} className="studio-form-field">
              <div className="smallMuted">{field.label}</div>
              <select
                className="inputX"
                value={String(val)}
                onChange={(e) => onChange(field, e.target.value)}
              >
                {(field.options || []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {err && <div className="smallMuted">{err}</div>}
            </div>
          );
        }
        if (field.type === "checkbox") {
          return (
            <div key={field.id} className="studio-form-field">
              <label className="smallMuted">
                <input
                  type="checkbox"
                  checked={Boolean(val)}
                  onChange={(e) => onChange(field, e.target.checked)}
                />
                {` ${field.label}`}
              </label>
              {err && <div className="smallMuted">{err}</div>}
            </div>
          );
        }
        return (
          <div key={field.id} className="studio-form-field">
            <div className="smallMuted">{field.label}</div>
            <input
              className="inputX"
              type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text"}
              value={String(val)}
              onChange={(e) => onChange(field, e.target.value)}
            />
            {err && <div className="smallMuted">{err}</div>}
          </div>
        );
      })}
    </div>
  );
}
