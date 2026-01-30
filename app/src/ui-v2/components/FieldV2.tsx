import React from "react";

type FieldBase = {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
};

type TextFieldProps = FieldBase & {
  kind?: "text" | "email" | "tel";
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
};

type SelectFieldProps = FieldBase & {
  kind: "select";
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
};

export function FieldV2(props: TextFieldProps | SelectFieldProps) {
  const id = React.useId();
  const requiredMark = props.required ? " *" : "";

  return (
    <div className="v2-field">
      <label className="v2-label" htmlFor={id}>
        {props.label}
        <span className="v2-required">{requiredMark}</span>
      </label>

      {"kind" in props && props.kind === "select" ? (
        <select
          id={id}
          className={`v2-input ${props.error ? "is-error" : ""}`}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
        >
          {props.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          className={`v2-input ${props.error ? "is-error" : ""}`}
          type={("kind" in props && props.kind) || "text"}
          value={props.value}
          placeholder={("placeholder" in props && props.placeholder) || ""}
          onChange={(e) => ("onChange" in props ? props.onChange(e.target.value) : void 0)}
        />
      )}

      {props.hint ? <div className="v2-hint">{props.hint}</div> : null}
      {props.error ? <div className="v2-error">{props.error}</div> : null}
    </div>
  );
}
