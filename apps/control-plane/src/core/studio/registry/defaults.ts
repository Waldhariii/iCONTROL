import { ComponentRegistry } from "./registry";
import type { RegisteredComponent } from "./types";
import { Form, FORM_COMPONENT_ID } from "./builtins/form";
import { Table, TABLE_COMPONENT_ID } from "./builtins/table";

export function createDefaultRegistry(): ComponentRegistry {
  const r = new ComponentRegistry();
  const entries: RegisteredComponent[] = [
    { id: FORM_COMPONENT_ID, component: Form, meta: { displayName: "Form" } },
    { id: TABLE_COMPONENT_ID, component: Table, meta: { displayName: "Table" } },
  ];
  r.bulkRegister(entries);
  return r;
}
