import type { Role } from "./types";
import type { Claims } from "./policy";
import { authorize } from "./policy";

export class AccessDenied extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccessDenied";
  }
}

export function enforce(claims: Claims, required: Role): void {
  const d = authorize(claims, required);
  if (!d.ok) throw new AccessDenied(`RBAC denied: required=${required} top=${d.top}`);
}
