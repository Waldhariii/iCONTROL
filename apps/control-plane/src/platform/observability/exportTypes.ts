/**
 * O3 Export pipeline — event and envelope types.
 * Reuses existing types; no breaking changes. Anomaly payload defined inline to avoid cycle with anomalyGuard.
 */
import type { LogEvent } from "./types";
import type { MetricsSnapshot } from "./metricsStore";
import type { Span } from "./tracer";

export type MetricsExportEvent = {
  kind: "metrics";
  ts: string;
  correlationId?: string;
  payload: MetricsSnapshot;
};

export type TraceExportEvent = {
  kind: "trace";
  ts: string;
  correlationId?: string;
  payload: Span[];
};

export type LogExportEvent = {
  kind: "log";
  ts: string;
  correlationId?: string;
  payload: LogEvent[];
};

export type AnomalyExportPayload = {
  first401StormWarnTs: number | null;
  recent401Count: number;
  recentLoginAttemptsCount: number;
  lastRouteHash: string;
  fallbackCount: number;
  lastFallbackTs: number;
};

export type AnomalyExportEvent = {
  kind: "anomaly";
  ts: string;
  correlationId?: string;
  payload: AnomalyExportPayload;
};

export type ExportEvent =
  | MetricsExportEvent
  | TraceExportEvent
  | LogExportEvent
  | AnomalyExportEvent;

export type ExportEnvelope = {
  schema: "icontrol.observability.v1";
  source: "control-plane";
  tenantId?: string;
  actorId?: string;
  correlationId?: string;
  batchId: string;
  sentAt?: string;
  events: ExportEvent[];
};
