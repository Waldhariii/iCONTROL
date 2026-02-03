export type TelemetrySpan = {
  name: string;
  tsStart: number;
  tsEnd?: number;
  tags?: Record<string,string>;
};

export interface TelemetryContract {
  spanStart(name: string, tags?: Record<string,string>): TelemetrySpan;
  spanEnd(span: TelemetrySpan, tags?: Record<string,string>): void;
}
export const TELEMETRY_CONTRACT_ID = "telemetry.contract.v1";
