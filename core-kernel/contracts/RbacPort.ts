import type { ErrorCode } from "../domain/errors/errorCodes";

export type Role = string;
export type Permission = string;

export type AccessDecision = {
  allowed: boolean;
  reason?: string;
};

export type RbacError = {
  code: ErrorCode;
  message: string;
  detail?: Record<string, unknown>;
};

export type RbacResult =
  | { ok: true; decision: AccessDecision }
  | { ok: false; error: RbacError };

export interface RbacPort {
  hasRole(role: Role): Promise<boolean>;
  can(permission: Permission): Promise<RbacResult>;
  getRoles(): Promise<Role[]>;
  getPermissions(): Promise<Permission[]>;
}
