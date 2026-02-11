export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [k: string]: JsonValue };

export type SafeRenderResult =
  | { ok: true; html: string }
  | { ok: false; reason: "render_blocked" | "invalid_input" | "internal_error"; detail?: string };
