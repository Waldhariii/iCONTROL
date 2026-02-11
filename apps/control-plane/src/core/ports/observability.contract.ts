export type ObsEvent = {
  name: string;
  ts: number;
  level?: "debug"|"info"|"warn"|"error";
  tags?: Record<string,string>;
  data?: Record<string,unknown>;
};

export interface ObservabilityContract {
  emit(e: ObsEvent): void;
}
export const OBSERVABILITY_CONTRACT_ID = "observability.contract.v1";
