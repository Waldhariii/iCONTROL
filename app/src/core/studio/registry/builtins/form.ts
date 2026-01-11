export const FORM_COMPONENT_ID = "builtin.form";

export type FormProps = {
  title?: string;
  fields?: Array<{ id: string; label?: string; type?: string }>;
};

/**
 * Framework-agnostic builtin.
 * Returns an object payload (safe for non-React runtime); later adapters can render it.
 */
export function Form(props: Record<string, unknown> = {}): unknown {
  const p = props as FormProps;
  return {
    kind: "FORM",
    title: typeof p.title === "string" ? p.title : "Form",
    fields: Array.isArray(p.fields) ? p.fields : [],
  };
}
