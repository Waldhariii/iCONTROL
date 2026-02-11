/**
 * RedirectAdapter — Contract v1
 * - Centralizes redirect mechanics to avoid policy violations (no scattered location.hash writes).
 */
export type RedirectTarget =
  | { kind: "blocked"; reason?: string }
  | { kind: "dashboard"; appKind: "CP" | "APP"; reason?: string };

export interface RedirectAdapter {
  redirect(target: RedirectTarget): void;
}
