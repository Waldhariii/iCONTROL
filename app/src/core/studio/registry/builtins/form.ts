export const FORM_COMPONENT_ID = "Form";

/**
 * DOM/agnostic builtin descriptor (not React).
 * Runtime may treat this as a resolvable component id.
 */
export const FormBuiltin = {
  kind: "builtin",
  id: FORM_COMPONENT_ID,
  renderHint: "form",
} as const;
