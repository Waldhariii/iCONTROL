import type { Capabilities } from "../entitlements";

export type Role = "owner" | "admin" | "manager" | "user" | "viewer";

export type ActorContext = {
  tenantId: string;
  actorId?: string;
  role: Role;
  capabilities: Capabilities;
};

export type PolicyDecision = {
  allow: boolean;
  reasonCode: string; // ERR_/WARN_ compatible
};
