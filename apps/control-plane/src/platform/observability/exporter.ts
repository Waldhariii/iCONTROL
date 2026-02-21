/**
 * O3 Exporter — scheduler, retry, batching. Never throw. SSR-safe.
 */
import type { ExportEvent, ExportEnvelope } from "./exportTypes";
import type { ExportConfig } from "./exportConfig";
import type { MetricsSnapshot } from "./metricsStore";
import type { Span } from "./tracer";
import type { AnomalyExportPayload } from "./exportTypes";
import { getCorrelationId } from "./correlation";
import { getTraceDump } from "./tracer";
import { enqueue, dequeueBatch, size } from "./exportQueue";
import { createNoopTransport, createFetchTransport } from "./exportTransport";
import { applyExportPolicy, estimateJsonBytes, DEFAULT_EXPORT_POLICY } from "./exportPolicy";

const MAX_ITEMS_PER_BATCH = 25;
const MIN_INTERVAL_MS = 2000;
const RETRY_BACKOFF_MS = [2000, 4000, 8000];
const RETRY_CAP_MS = 30000;

type Transport = { send(envelope: ExportEnvelope): Promise<{ ok: true } | { ok: false; error: string; retryable: boolean }> };
type IncrementFn = (name: string, delta?: number) => void;

let transport: Transport = createNoopTransport();
let enabled = false;
let incrementMetric: IncrementFn = () => {};
let lastSendTs: number | undefined;
let lastError: string | undefined;
let intervalId: ReturnType<typeof setTimeout> | null = null;
let retryCount = 0;

function nextBatchId(): string {
  return `batch_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function getRuntimeContext(): { tenantId?: string; actorId?: string } {
  try {
    if (typeof window === "undefined") return {};
    const rt = (window as unknown as { __ICONTROL_RUNTIME__?: { tenantId?: string; actorId?: string } }).__ICONTROL_RUNTIME__;
    if (rt && typeof rt === "object") {
      const o: { tenantId?: string; actorId?: string } = {};
      if (rt.tenantId !== undefined) o.tenantId = rt.tenantId;
      if (rt.actorId !== undefined) o.actorId = rt.actorId;
      return o;
    }
  } catch {}
  return {};
}

function buildEnvelope(events: ExportEvent[]): ExportEnvelope {
  const ctx = getRuntimeContext();
  const envelope: ExportEnvelope = {
    schema: "icontrol.observability.v1",
    source: "control-plane",
    batchId: nextBatchId(),
    sentAt: new Date().toISOString(),
    events,
    correlationId: getCorrelationId(),
  };
  if (ctx.tenantId !== undefined) envelope.tenantId = ctx.tenantId;
  if (ctx.actorId !== undefined) envelope.actorId = ctx.actorId;
  return envelope;
}

function flush(): void {
  try {
    if (typeof window === "undefined") return;
    let batch = dequeueBatch(MAX_ITEMS_PER_BATCH);
    if (batch.length === 0) return;

    const maxEnvelopeBytes = DEFAULT_EXPORT_POLICY.maxEnvelopeBytes;
    let envelope = buildEnvelope(batch);
    while (batch.length > 1 && estimateJsonBytes(envelope) > maxEnvelopeBytes) {
      batch = batch.slice(1);
      incrementMetric("observability.export.dropped_oversize_envelope");
      envelope = buildEnvelope(batch);
    }
    if (batch.length === 1 && estimateJsonBytes(envelope) > maxEnvelopeBytes) {
      incrementMetric("observability.export.dropped_oversize_event");
      return;
    }

    transport.send(envelope).then((result) => {
      try {
        if (result.ok) {
          lastSendTs = Date.now();
          lastError = undefined;
          retryCount = 0;
          incrementMetric("observability.export.sent", batch.length);
        } else {
          lastError = result.error;
          if (result.retryable) {
            incrementMetric("observability.export.failed_retryable");
            const backoff = Math.min(RETRY_BACKOFF_MS[Math.min(retryCount, RETRY_BACKOFF_MS.length - 1)] ?? RETRY_CAP_MS, RETRY_CAP_MS);
            retryCount++;
            setTimeout(() => flush(), backoff);
          } else {
            incrementMetric("observability.export.failed_nonretryable");
          }
        }
      } catch {
        lastError = "flush callback error";
        incrementMetric("observability.export.failed_retryable");
      }
    }).catch(() => {
      lastError = "send throw";
      incrementMetric("observability.export.failed_retryable");
    });
  } catch {
    // silent
  }
}

function scheduleFlush(): void {
  try {
    if (typeof window === "undefined") return;
    if (intervalId !== null) return;
    intervalId = setTimeout(() => {
      intervalId = null;
      flush();
      scheduleFlush();
    }, MIN_INTERVAL_MS);
  } catch {
    // silent
  }
}

export function initExporter(config: ExportConfig & { onIncrement?: IncrementFn }): void {
  try {
    if (typeof window === "undefined") return;
    incrementMetric = config.onIncrement ?? (() => {});
    enabled = config.enabled && config.transport !== "noop";
    if (config.transport === "fetch" && config.endpoint) {
      const opts: { endpoint: string; apiKey?: string; timeoutMs?: number } = { endpoint: config.endpoint, timeoutMs: 15000 };
      if (config.apiKey) opts.apiKey = config.apiKey;
      transport = createFetchTransport(opts);
    } else {
      transport = createNoopTransport();
      enabled = false;
    }
    if (enabled) scheduleFlush();
  } catch {
    enabled = false;
    transport = createNoopTransport();
  }
}

export function exportNow(_reason?: string): void {
  try {
    if (typeof window === "undefined") return;
    const traceDump = getTraceDump();
    if (traceDump.length > 0) recordTraceExport(traceDump);
    flush();
  } catch {
    // silent
  }
}

function enqueueEvent(event: ExportEvent): void {
  try {
    if (!enabled) return;
    const policyResult = applyExportPolicy(event as ExportEvent & { [k: string]: unknown });
    if (!policyResult.ok) {
      if (policyResult.reason === "oversize_event") incrementMetric("observability.export.dropped_oversize_event");
      else if (policyResult.reason === "policy_error") incrementMetric("observability.export.dropped_policy_error");
      else incrementMetric("observability.export.dropped");
      return;
    }
    const ok = enqueue(policyResult.event);
    if (ok) incrementMetric("observability.export.enqueued");
    else incrementMetric("observability.export.dropped");
  } catch {
    // silent
  }
}

export function recordMetricsExport(snapshot: MetricsSnapshot): void {
  try {
    const ts = new Date().toISOString();
    enqueueEvent({ kind: "metrics", ts, correlationId: getCorrelationId(), payload: snapshot });
    scheduleFlush();
  } catch {
    // silent
  }
}

export function recordTraceExport(traceDump: Span[]): void {
  try {
    const ts = new Date().toISOString();
    enqueueEvent({ kind: "trace", ts, correlationId: getCorrelationId(), payload: traceDump });
    scheduleFlush();
  } catch {
    // silent
  }
}

export function recordAnomalyExport(snapshot: AnomalyExportPayload): void {
  try {
    const ts = new Date().toISOString();
    enqueueEvent({ kind: "anomaly", ts, correlationId: getCorrelationId(), payload: snapshot });
    exportNow("anomaly");
  } catch {
    // silent
  }
}

export function getExporterState(): { enabled: boolean; queueSize: number; lastSendTs?: number; lastError?: string } {
  try {
    const state: { enabled: boolean; queueSize: number; lastSendTs?: number; lastError?: string } = { enabled, queueSize: size() };
    if (lastSendTs !== undefined) state.lastSendTs = lastSendTs;
    if (lastError !== undefined) state.lastError = lastError;
    return state;
  } catch {
    return { enabled: false, queueSize: 0 };
  }
}
