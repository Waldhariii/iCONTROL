import type { Role } from "./types";
import { roleRank } from "./ranks";

export function hasRole(userRole: Role, required: Role): boolean {
  return roleRank[userRole] >= roleRank[required];
}

export function highestRole(roles: Role[]): Role {
  if (!roles.length) return "USER_READONLY";
  let best: Role = roles[0];
  for (const r of roles) {
    if (roleRank[r] > roleRank[best]) best = r;
  }
  return best;
}

export type Claims = {
  userId: string;
  roles: Role[];
};

export function authorize(claims: Claims, required: Role) {
  const top = highestRole(claims.roles);
  const ok = hasRole(top, required);
  return ok
    ? { ok: true as const }
    : { ok: false as const, reason: "missing_role" as const, required, top };
}
