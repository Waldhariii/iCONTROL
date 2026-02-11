export type Permission = string;

export type Claims = {
  userId?: string;
  roles?: readonly string[];
  permissions?: readonly Permission[];
};

export function hasAllPermissions(
  claims: Claims | undefined,
  requires: readonly Permission[] | undefined
): boolean {
  if (!requires || requires.length === 0) return true;
  const set = new Set((claims?.permissions ?? []).map(String));
  return requires.every((p) => set.has(String(p)));
}
