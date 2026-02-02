export type CostMetric = "write" | "read" | "compute" | "storage";

export interface CostEvent {
  ts: string;
  tenantId: string;
  feature?: string;
  metric: CostMetric;
  units: number; // abstract units
  correlationId?: string;
}

export interface CostSink {
  record(evt: CostEvent): void;
}

export function createInMemoryCostSink() {
  const events: CostEvent[] = [];
  const sink: CostSink = {
    record(evt) {
      events.push(evt);
    },
  };
  return { sink, events };
}
