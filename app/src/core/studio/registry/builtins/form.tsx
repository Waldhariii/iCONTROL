import React from "react";

export const FORM_COMPONENT_ID = "builtin:form";

export function Form(props: { title?: string }) {
  return (
    <div>
      <h3>{props.title ?? "Form"}</h3>
      <p>Placeholder Form component (iCONTROL core builtin).</p>
    </div>
  );
}
