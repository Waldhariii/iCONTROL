import { getTenantId } from "./tenant";

/**
 * Namespaced storage keys (v1)
 * Example output: "icontrol.t.public.auditLog.v1"
 */
export function nsKey(base: string): string {
  const t = getTenantId();
  return `icontrol.t.${t}.${base}`;
}
