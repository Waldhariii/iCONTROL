/**
 * O3 Export transport — NOOP + fetch. Never throw.
 */
import type { ExportEnvelope } from "./exportTypes";
import { getCorrelationId } from "./correlation";

export type ExportTransport = {
  send(envelope: ExportEnvelope): Promise<{ ok: true } | { ok: false; error: string; retryable: boolean }>;
};

export function createNoopTransport(): ExportTransport {
  return {
    send(): Promise<{ ok: true }> {
      return Promise.resolve({ ok: true });
    },
  };
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

export function createFetchTransport(opts: {
  endpoint: string;
  apiKey?: string;
  timeoutMs?: number;
}): ExportTransport {
  const { endpoint, apiKey, timeoutMs = 10_000 } = opts;
  return {
    async send(envelope: ExportEnvelope): Promise<{ ok: true } | { ok: false; error: string; retryable: boolean }> {
      try {
        const headers: Record<string, string> = {
          "content-type": "application/json",
          "x-correlation-id": envelope.correlationId ?? getCorrelationId(),
        };
        if (apiKey) headers["authorization"] = `Bearer ${apiKey}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const res = await fetch(endpoint, {
          method: "POST",
          headers,
          body: JSON.stringify(envelope),
          credentials: "omit",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) return { ok: true };
        const retryable = isRetryableStatus(res.status);
        const text = await res.text().catch(() => "");
        return { ok: false, error: `HTTP ${res.status} ${text.slice(0, 200)}`, retryable };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return { ok: false, error: message, retryable: true };
      }
    },
  };
}
