import type { ErrorCode } from "../domain/errors/errorCodes";

export type AuthToken = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
};

export type AuthSession = {
  userId: string;
  username: string;
  roles: string[];
  issuedAt: number;
  expiresAt?: number;
};

export type AuthCredentials = {
  username: string;
  password: string;
};

export type AuthError = {
  code: ErrorCode;
  message: string;
  detail?: Record<string, unknown>;
};

export type AuthResult =
  | { ok: true; session: AuthSession; token?: AuthToken }
  | { ok: false; error: AuthError };

export interface AuthPort {
  getSession(): Promise<AuthSession | null>;
  login(credentials: AuthCredentials): Promise<AuthResult>;
  logout(): Promise<void>;
  getAccessToken(): Promise<AuthToken | null>;
}
