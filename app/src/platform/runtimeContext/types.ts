export type RuntimeAppKind = "APP" | "CP";

export type RuntimeContext = {
  tenantId: string;
  actorId?: string;
  appKind: RuntimeAppKind;
  isProd: boolean;
  source: "global" | "default";
};
