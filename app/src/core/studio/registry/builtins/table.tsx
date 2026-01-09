import React from "react";

export const TABLE_COMPONENT_ID = "builtin:table";

export function Table(props: { title?: string }) {
  return (
    <div>
      <h3>{props.title ?? "Table"}</h3>
      <p>Placeholder Table component (iCONTROL core builtin).</p>
    </div>
  );
}
