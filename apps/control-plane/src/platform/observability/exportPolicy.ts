/* Strict continuity: CP-only. No throws. */

import type {
  MetricsExportEvent,
  TraceExportEvent,
  LogExportEvent,
  AnomalyExportEvent,
} from "./exportTypes";

export type ExportEvent =
  | MetricsExportEvent
  | TraceExportEvent
  | LogExportEvent
  | AnomalyExportEvent;

export type ExportPolicyConfig = {
  maxEventBytes: number;
  maxEnvelopeBytes: number;
  maxDepth: number;
  maxKeysPerObject: number;
  maxArrayLength: number;
  maxStringLength: number;
};

export const DEFAULT_EXPORT_POLICY: ExportPolicyConfig = {
  maxEventBytes: 16_000,
  maxEnvelopeBytes: 256_000,
  maxDepth: 6,
  maxKeysPerObject: 60,
  maxArrayLength: 120,
  maxStringLength: 2_000,
};

export function estimateJsonBytes(obj: unknown): number {
  try {
    const s = JSON.stringify(obj);
    try {
      return new TextEncoder().encode(s).length;
    } catch {
      return typeof s === "string" ? s.length : 0;
    }
  } catch {
    return 0;
  }
}

const REDACTION = "[REDACTED]";
const TRUNCATED = "[TRUNCATED]";
const BASE64_REDACTED = "[BASE64_REDACTED]";

export function sanitizeString(s: string, cfg: ExportPolicyConfig): string {
  try {
    let out = s;

    // Bearer tokens
    out = out.replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, `Bearer ${REDACTION}`);

    // JWT-ish (3 segments dot-separated)
    out = out.replace(
      /\beyJ[A-Za-z0-9\-_]+?\.[A-Za-z0-9\-_]+?\.([A-Za-z0-9\-_]+)?\b/g,
      REDACTION
    );

    // Common secret keywords (very conservative)
    out = out.replace(
      /\b(api[_-]?key|token|secret|password)\b\s*[:=]\s*([^\s,;]+)/gi,
      (_m, k) => `${k}:${REDACTION}`
    );

    // Emails
    out = out.replace(
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
      REDACTION
    );

    // Long base64-ish blobs
    out = out.replace(/\b[A-Za-z0-9+/]{120,}={0,2}\b/g, BASE64_REDACTED);

    // Hard cap length
    if (out.length > cfg.maxStringLength) {
      out = out.slice(0, cfg.maxStringLength) + TRUNCATED;
    }

    return out;
  } catch {
    return REDACTION;
  }
}

export function sanitizeObjectDeep(
  value: unknown,
  cfg: ExportPolicyConfig,
  depth = 0
): unknown {
  try {
    if (depth > cfg.maxDepth) return "[MAX_DEPTH]";

    if (value === null || value === undefined) return value;

    const t = typeof value;

    if (t === "string") return sanitizeString(value as string, cfg);
    if (t === "number" || t === "boolean") return value;
    if (t === "bigint") return String(value);
    if (t === "function" || t === "symbol") return `[${t}]`;

    if (Array.isArray(value)) {
      const arr = value as unknown[];
      const limited = arr.slice(0, cfg.maxArrayLength);
      return limited.map((v) => sanitizeObjectDeep(v, cfg, depth + 1));
    }

    if (t === "object") {
      const obj = value as Record<string, unknown>;
      const keys = Object.keys(obj).slice(0, cfg.maxKeysPerObject);
      const out: Record<string, unknown> = {};
      for (const k of keys) {
        const safeKey =
          typeof k === "string" ? sanitizeString(k, cfg).slice(0, 128) : String(k);
        out[safeKey] = sanitizeObjectDeep(obj[k], cfg, depth + 1);
      }
      return out;
    }

    return String(value);
  } catch {
    return "[SANITIZE_ERROR]";
  }
}

function isValidKind(kind: unknown): kind is "metrics" | "trace" | "log" | "anomaly" {
  return kind === "metrics" || kind === "trace" || kind === "log" || kind === "anomaly";
}

export function applyExportPolicy(
  event: ExportEvent,
  cfg: ExportPolicyConfig = DEFAULT_EXPORT_POLICY
):
  | { ok: true; event: ExportEvent }
  | { ok: false; reason: "oversize_event" | "policy_error" | "invalid_event" } {
  try {
    const ev = event as Record<string, unknown>;
    const kind = ev["kind"];

    if (!isValidKind(kind)) {
      return { ok: false, reason: "invalid_event" };
    }

    const sanitized = {
      ...ev,
      payload: sanitizeObjectDeep(ev["payload"], cfg, 0),
    } as ExportEvent;

    const bytes = estimateJsonBytes(sanitized);
    if (bytes > cfg.maxEventBytes) {
      return { ok: false, reason: "oversize_event" };
    }

    return { ok: true, event: sanitized };
  } catch {
    return { ok: false, reason: "policy_error" };
  }
}
