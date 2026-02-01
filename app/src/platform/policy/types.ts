export type AppKind = "APP" | "CP";

export type Decision =
  | { ok: true }
  | { ok: false; code: string; reason: string };

export type PolicyContext = {
  appKind: AppKind;
  tenantId?: string;
  userId?: string;
  roles?: string[];
  entitlements?: Record<string, boolean>;
  safeMode?: boolean;
};

export type WriteIntent = {
  op: "storage:set" | "storage:delete" | "api:call" | "log:append";
  namespace?: string; // e.g. "tenant:<id>"
  key?: string;
  meta?: Record<string, unknown>;
};
